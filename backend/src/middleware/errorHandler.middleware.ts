import { Request, Response, NextFunction } from "express";

// Централізований обробник помилок для всього додатка
export const errorHandlerMiddleware = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const statusCode = err.status || 500;
  const errorCode = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "Внутрішня помилка сервера";
  const details = err.details || null;

  // Логуємо критичні помилки (500) у консоль сервера
  if (statusCode === 500) {
    console.error("Unhandled server error:", err);
  }

  // Повертаємо помилку у стандартизованому форматі
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: message,
      details: details,
    },
  });
};
