import path from "path";
import fs from "fs";
import sqlite3 from "sqlite3";

// Вмикаємо логування помилок від sqlite3
const sqlite = sqlite3.verbose();

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "app.db");

// Переконуємось, що папка data існує
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Створюємо та підключаємо базу даних
export const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error("Помилка відкриття бази даних SQLite:", err.message);
    process.exit(1);
  }
  console.log("Підключено до бази даних SQLite за шляхом:", dbPath);
});
