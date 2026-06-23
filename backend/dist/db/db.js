"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sqlite3_1 = __importDefault(require("sqlite3"));
// Вмикаємо логування помилок від sqlite3
const sqlite = sqlite3_1.default.verbose();
const dataDir = path_1.default.join(process.cwd(), "data");
const dbPath = path_1.default.join(dataDir, "app.db");
// Переконуємось, що папка data існує
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
// Створюємо та підключаємо базу даних
exports.db = new sqlite.Database(dbPath, (err) => {
    if (err) {
        console.error("Помилка відкриття бази даних SQLite:", err.message);
        process.exit(1);
    }
    console.log("Підключено до бази даних SQLite за шляхом:", dbPath);
});
