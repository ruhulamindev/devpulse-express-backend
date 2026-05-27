import type {
  NextFunction,
  Request,
  Response
} from "express";

export const globalErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {

    if (error instanceof Error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};