"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const migrate_1 = require("./db/migrate");
const PORT = 3000;
// Функція для ініціалізації бази даних та запуску сервера
async function bootstrap() {
    // Запускаємо міграції перед стартом сервера, щоб таблиці гарантовано існували
    await (0, migrate_1.migrate)();
    // Запуск Express сервера на порту 3000
    app_1.default.listen(PORT, () => {
        console.log(`[SERVER] Сервер запущено на порту ${PORT} (http://localhost:${PORT})`);
    });
}
bootstrap().catch((err) => {
    console.error("[SERVER] Фатальна помилка запуску сервера:", err);
    process.exit(1);
});
