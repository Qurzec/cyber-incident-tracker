"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
// Клас для створення помилок з HTTP статус-кодами
// Успадковує стандартний Error, щоб ми могли кидати його через throw
class ApiError extends Error {
    status; // наприклад, 400, 404, 500
    code; // унікальний код помилки для клієнта (наприклад, 'VALIDATION_ERROR')
    details; // масив деталей (корисний для помилок валідації полів)
    constructor(status, code, message, details = null) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
        // Потрібно для правильної роботи instanceof в TypeScript
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
exports.ApiError = ApiError;
