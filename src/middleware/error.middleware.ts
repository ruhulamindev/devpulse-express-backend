import type {
  NextFunction,
  Request,
  Response
} from "express";

export const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  res.status(500).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
};