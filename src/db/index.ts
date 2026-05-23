import { Pool } from "pg";
import config from "../config/envdot";

// DB Connection
export const pool = new Pool({
    connectionString: config.connection_string,
})

// DB signup user Table Create
export const initDB = async () => {
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