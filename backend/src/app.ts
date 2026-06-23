import express from "express";
import cors from "cors";
import usersRoutes from "./routes/users.routes";
import incidentsRoutes from "./routes/incidents.routes";
import { loggerMiddleware } from "./middleware/logger.middleware";
import { errorHandlerMiddleware } from "./middleware/errorHandler.middleware";

const app = express();

// Форматування JSON-відповідей (з новими рядками та відступами)
app.set("json spaces", 2);

// Список дозволених джерел (Origin whitelist) для CORS (Рівень "На Добре/Відмінно")
const allowedOrigins = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

// Налаштування CORS згідно з вимогами Лабораторної роботи №4
app.use(
  cors({
    origin: (origin, callback) => {
      // дозволяємо запити без origin (наприклад, curl, Postman тощо)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(
        new Error("CORS: Доступ заблоковано політикою безпеки (Origin не дозволено)"),
        false
      );
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Обробка попередніх запитів preflight OPTIONS для всіх маршрутів
app.options("*", cors());

// Middleware для зчитування JSON у req.body
app.use(express.json());

// Логування запитів (метод, URL, статус та час обробки)
app.use(loggerMiddleware);

// Підключення маршрутів із версійністю /api/v1/... (Рівень "На Відмінно")
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/incidents", incidentsRoutes);

// Обробка неіснуючих маршрутів (404)
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Шлях ${req.method} ${req.originalUrl} не знайдено`,
    },
  });
});

// Централізований обробник помилок (має бути підключений останнім!)
app.use(errorHandlerMiddleware);

export default app;
