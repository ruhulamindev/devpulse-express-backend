import type { Request, Response } from "express";
import { signupService, loginService } from "./auth.service";


// SIGNUP CONTROLLER
export const signupUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        const user = await signupService({ name, email, password, role });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// LOGIN CONTROLLER
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const data = await loginService({ email, password });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};