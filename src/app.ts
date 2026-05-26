import express, { type Application, type Request, type Response } from "express"
import authRoutes from "./modules/auth/auth.routes";
import issuesRoutes from "./modules/issues/issues.routes";
import { globalErrorHandler } from "./middleware/error.middleware";

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

// auth api
app.use("/api/auth", authRoutes);

// issues api
app.use("/api/issues", issuesRoutes);


// Global Error Handling Middleware
app.use(globalErrorHandler);

export default app