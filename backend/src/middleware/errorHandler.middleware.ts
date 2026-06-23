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
  let statusCode = err.status || 500;
  let errorCode = err.code || "INTERNAL_SERVER_ERROR";
  let message = err.message || "Внутрішня помилка сервера";
  const details = err.details || null;

  // Обробка специфічних помилок обмежень бази даних SQLite
  if (err.message && typeof err.message === "string") {
    if (err.message.includes("UNIQUE constraint failed")) {
      statusCode = 409;
      errorCode = "UNIQUE_CONSTRAINT_VIOLATION";
      // Отримуємо детальну інформацію про те, яке поле порушено
      const fieldInfo = err.message.split(": ").pop();
      message = `Цей запис вже існує у базі даних. Деталі: ${fieldInfo}`;
    } else if (
      err.message.includes("NOT NULL constraint failed") ||
      err.message.includes("CHECK constraint failed")
    ) {
      statusCode = 400;
      errorCode = "DATABASE_CONSTRAINT_ERROR";
      const fieldInfo = err.message.split(": ").pop();
      message = `Дані не відповідають вимогам схеми бази даних. Деталі: ${fieldInfo}`;
    } else if (err.message.includes("FOREIGN KEY constraint failed")) {
      statusCode = 409;
      errorCode = "FOREIGN_KEY_CONSTRAINT_FAILED";
      message =
        "Помилка цілісності зв'язків: неможливо виконати операцію через обмеження зовнішнього ключа (FOREIGN KEY).";
    }
  }

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
