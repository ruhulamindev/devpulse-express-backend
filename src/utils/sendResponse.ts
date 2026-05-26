import type { Response } from "express";

interface SendResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
}

export const sendResponse = <T>(
  res: Response,
  data: SendResponse<T>
) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
  });
};