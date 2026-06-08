// Клас для створення помилок з HTTP статус-кодами
class ApiError extends Error {
    constructor(status, code, message, details = null) {
        super(message);
        this.status = status; // наприклад, 400 або 404
        this.code = code;     // унікальний код помилки
        this.details = details; // деталі помилок валідації
    }
}

module.exports = ApiError;
