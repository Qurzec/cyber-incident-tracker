"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dbClient_1 = require("./dbClient");
// Функція для запуску міграцій при старті сервера
async function migrate() {
    console.log("Початок перевірки та запуску міграцій БД...");
    // Вмикаємо підтримку FOREIGN KEY
    await (0, dbClient_1.run)("PRAGMA foreign_keys = ON;");
    // Створюємо таблицю міграцій, якщо її ще немає
    await (0, dbClient_1.run)(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      appliedAt TEXT NOT NULL
    );
  `);
    const migrationsDir = path_1.default.join(process.cwd(), "migrations");
    // Перевіряємо, чи існує папка з міграціями
    if (!fs_1.default.existsSync(migrationsDir)) {
        console.warn("Папку migrations не знайдено, пропускаємо крок міграцій.");
        return;
    }
    // Зчитуємо всі файли міграцій, сортуємо їх за номером (напр. 001_, 002_)
    const files = fs_1.default
        .readdirSync(migrationsDir)
        .filter((f) => /^\d+_.+\.sql$/.test(f))
        .sort();
    // Отримуємо список уже застосованих міграцій
    const appliedRows = await (0, dbClient_1.all)("SELECT filename FROM schema_migrations;");
    const appliedSet = new Set(appliedRows.map((row) => row.filename));
    // Застосовуємо нові міграції
    for (const file of files) {
        if (appliedSet.has(file)) {
            continue; // Пропускаємо, якщо вже застосовано
        }
        console.log(`Застосування міграції: ${file}...`);
        const filePath = path_1.default.join(migrationsDir, file);
        const sqlContent = fs_1.default.readFileSync(filePath, "utf8").trim();
        if (!sqlContent)
            continue;
        // Розділяємо міграцію на окремі SQL-команди за символом ";" і виконуємо по черзі
        const statements = sqlContent
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        for (const statement of statements) {
            await (0, dbClient_1.run)(statement);
        }
        // Записуємо інформацію про успішне застосування міграції
        const now = new Date().toISOString();
        await (0, dbClient_1.run)(`
      INSERT INTO schema_migrations (filename, appliedAt)
      VALUES ('${file}', '${now}');
    `);
        console.log(`Успішно застосовано: ${file}`);
    }
    console.log("Ініціалізація схеми БД завершена.");
}
