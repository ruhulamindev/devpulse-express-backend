import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware";
import {
    createIssueService,
    getAllIssuesService,
    getSingleIssueService,
    updateIssueService,
    deleteIssueService,
} from "./issues.service";
import type { IssueQuery } from "./issue.interface";
import { sendResponse } from "../../utils/sendResponse";

// Create Issue
export const createIssue = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        const result = await createIssueService(req.body, req.user!.id);

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "Issue created successfully",
            data: result,
        });

    } catch (error) {
        next(error);
    }
};


// Get All Issues
export const getAllIssues = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

        const result = await getAllIssuesService(req.query as IssueQuery);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issues retrived successfully",
            data: result,
        });

    } catch (error) {
        next(error);
    }
};


// Get Single Issue
export const getSingleIssue = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

        const result = await getSingleIssueService(req);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue retrived successfully",
            data: result,
        });

    } catch (error) {
        next(error);
    }
};


// Update Issue
export const updateIssue = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        const result = await updateIssueService(req);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue updated successfully",
            data: result,
        });

    } catch (error) {
        next(error);
    }
};


// Delete Issue
export const deleteIssue = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        await deleteIssueService(req);

        sendResponse(res, {
            statusCode: 204,
            success: true,
            message: "Issue deleted successfully",
        });

    } catch (error) {
        next(error);
    }
};