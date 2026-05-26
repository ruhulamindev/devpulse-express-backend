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

// Create Issue
export const createIssue = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        const result = await createIssueService(req.body, req.user!.id);

        res.status(201).json({
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

        res.status(200).json({
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

        res.status(200).json({
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

        res.status(200).json({
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

        res.status(200).json({
            success: true,
            message: "Issue deleted successfully",
        });

    } catch (error) {
        next(error);
    }
};