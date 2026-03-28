import { Response } from "express";

interface IResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  data?: T;
}

export const sendResponse = <T>(res: Response, payload: IResponse<T>) => {
  const { statusCode, success, message, data } = payload;
  res.status(statusCode).json({
    success,
    message,
    data,
  });
};
