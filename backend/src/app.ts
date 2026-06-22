import express from "express";
import usersRoutes from "./routes/users.routes";
import incidentsRoutes from "./routes/incidents.routes";
import { loggerMiddleware } from "./middleware/logger.middleware";
import { errorHandlerMiddleware } from "./middleware/errorHandler.middleware";

const app = express();

// Форматування JSON-відповідей (з новими рядками та відступами)
app.set("json spaces", 2);

// Middleware для зчитування JSON у req.body
app.use(express.json());

// Простий middleware для дозволу CORS (щоб фронтенд міг робити запити)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Логування запитів (метод, URL, статус та час обробки)
app.use(loggerMiddleware);

// Підключення маршрутів
app.use("/api/users", usersRoutes);
app.use("/api/incidents", incidentsRoutes);

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
