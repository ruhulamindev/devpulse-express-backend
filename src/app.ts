import express, { type Application, type Request, type Response } from "express"
import { pool } from "./db"
import config from "./config/envdot"
import jwt from "jsonwebtoken";

const app: Application = express()

app.use(express.json())

// Root directory
app.get('/', (req: Request, res: Response) => {
    // res.send('Hello World!')
    res.status(200).json({
        "success": true,
        "message": "DevPulse Server Running",
        "author": "Ruhul Amin"
    })
})

// User Registration (signup)
app.post("/api/signup", async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const role = "contributor";

    try {
        const result = await pool.query(
            `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
            [name, email, password, role]
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result.rows[0],
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error,
        });
    }
});


// User Login
app.post("/api/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        // find user by email
        const result = await pool.query(
            `SELECT * FROM users WHERE email=$1`,
            [email]
        );

        // user not found
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = result.rows[0];

        // password check
        if (password !== user.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        // create jwt token
        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                role: user.role
            },
            config.jwt_secret as string,
            {
                expiresIn: "7d"
            }
        );

        // success response
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at,
                    updated_at: user.updated_at
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error
        });

    }

});


export default app