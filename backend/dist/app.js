"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const incidents_routes_1 = __importDefault(require("./routes/incidents.routes"));
const logger_middleware_1 = require("./middleware/logger.middleware");
const errorHandler_middleware_1 = require("./middleware/errorHandler.middleware");
const app = (0, express_1.default)();
// Форматування JSON-відповідей (з новими рядками та відступами)
app.set("json spaces", 2);
// Список дозволених джерел (Origin whitelist) для CORS (Рівень "На Добре/Відмінно")
const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];
// Налаштування CORS згідно з вимогами Лабораторної роботи №4 та №5
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // дозволяємо запити без origin (наприклад, curl, Postman тощо)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("CORS: Доступ заблоковано політикою безпеки (Origin не дозволено)"), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Demo-UserId"],
}));
// Встановлення безпекових заголовків (Лабораторна робота №5)
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
});
// Обробка попередніх запитів preflight OPTIONS для всіх маршрутів
app.options("*", (0, cors_1.default)());
// Middleware для зчитування JSON у req.body
app.use(express_1.default.json());
// Логування запитів (метод, URL, статус та час обробки)
app.use(logger_middleware_1.loggerMiddleware);
// Підключення маршрутів із версійністю /api/v1/... (Рівень "На Відмінно")
app.use("/api/v1/users", users_routes_1.default);
app.use("/api/v1/incidents", incidents_routes_1.default);
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
app.use(errorHandler_middleware_1.errorHandlerMiddleware);
exports.default = app;
