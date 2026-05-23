import express, { type Application, type Request, type Response } from "express"
import { pool } from "./db"

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

export default app