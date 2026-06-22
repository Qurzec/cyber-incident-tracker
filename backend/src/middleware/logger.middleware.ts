import { Request, Response, NextFunction } from "express";

// Middleware для логування запитів
// Виводить у консоль метод, шлях, статус-код та час виконання
export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Коли запит закінчив обробку
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(
      `[LOG] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`
    );
  });

  next();
};
