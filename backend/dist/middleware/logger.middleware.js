"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerMiddleware = void 0;
// Middleware для логування запитів
// Виводить у консоль метод, шлях, статус-код та час виконання
const loggerMiddleware = (req, res, next) => {
    const start = Date.now();
    // Коли запит закінчив обробку
    res.on("finish", () => {
        const ms = Date.now() - start;
        console.log(`[LOG] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
    });
    next();
};
exports.loggerMiddleware = loggerMiddleware;
