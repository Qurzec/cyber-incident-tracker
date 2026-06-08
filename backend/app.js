const express = require('express');
const app = express();

// Форматування JSON-відповідей (з новими рядками та відступами)
app.set('json spaces', 2);

const usersRoutes = require('./routes/users');
const incidentsRoutes = require('./routes/incidents');

// Middleware для зчитування JSON у req.body
app.use(express.json());

// Логування запитів (метод, URL, статус та час обробки)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`[LOG] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
    });
    next();
});

// Підключення маршрутів
app.use('/api/users', usersRoutes);
app.use('/api/incidents', incidentsRoutes);

// Обробка неіснуючих маршрутів
app.use((req, res, next) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `Шлях ${req.method} ${req.originalUrl} не знайдено`
        }
    });
});

// Централізований обробник помилок
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
    const message = err.message || 'Внутрішня помилка сервера';
    const details = err.details || null;
    
    if (statusCode === 500) {
        console.error(err);
    }
    
    res.status(statusCode).json({
        error: {
            code: errorCode,
            message: message,
            details: details
        }
    });
});

module.exports = app;
