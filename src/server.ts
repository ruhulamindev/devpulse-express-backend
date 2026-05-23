import express, { type Application, type Request, type Response } from "express"
import { Pool } from "pg"
import config from "./config/envdot"


const app: Application = express()
// Port
const port = config.port

app.use(express.json())

// DB Connection
const pool = new Pool({
    connectionString: config.connection_string,
})

// DB Table Create
const initDB = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,

    role VARCHAR(20) NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
      )`)
        console.log("Database connected successfully!!");
    } catch (error) {
        console.log(error);
    }
}
initDB()

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


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})