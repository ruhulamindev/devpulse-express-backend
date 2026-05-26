import type { NextFunction, Request, Response } from "express";
import { signupService, loginService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";


// SIGNUP CONTROLLER
export const signupUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, role } = req.body;

        const user = await signupService({ name, email, password, role });

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "User registered successfully",
            data: user,
        });

    } catch (error) {
        next(error);
    }
};


// LOGIN CONTROLLER
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const data = await loginService({ email, password });

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Login successful",
            data,
        });

    } catch (error) {
        next(error);
    }
};