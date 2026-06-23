import fs from "fs";
import path from "path";
import { run, all } from "./dbClient";

type MigrationRow = { filename: string };

// Функція для запуску міграцій при старті сервера
export async function migrate(): Promise<void> {
  console.log("Початок перевірки та запуску міграцій БД...");

  // Вмикаємо підтримку FOREIGN KEY
  await run("PRAGMA foreign_keys = ON;");

  // Створюємо таблицю міграцій, якщо її ще немає
  await run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      appliedAt TEXT NOT NULL
    );
  `);

  const migrationsDir = path.join(process.cwd(), "migrations");

  // Перевіряємо, чи існує папка з міграціями
  if (!fs.existsSync(migrationsDir)) {
    console.warn("Папку migrations не знайдено, пропускаємо крок міграцій.");
    return;
  }

  // Зчитуємо всі файли міграцій, сортуємо їх за номером (напр. 001_, 002_)
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort();

  // Отримуємо список уже застосованих міграцій
  const appliedRows = await all<MigrationRow>(
    "SELECT filename FROM schema_migrations;"
  );
  const appliedSet = new Set(appliedRows.map((row) => row.filename));

  // Застосовуємо нові міграції
  for (const file of files) {
    if (appliedSet.has(file)) {
      continue; // Пропускаємо, якщо вже застосовано
    }

    console.log(`Застосування міграції: ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(filePath, "utf8").trim();

    if (!sqlContent) continue;

    // Розділяємо міграцію на окремі SQL-команди за символом ";" і виконуємо по черзі
    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await run(statement);
    }

    // Записуємо інформацію про успішне застосування міграції
    const now = new Date().toISOString();
    await run(`
      INSERT INTO schema_migrations (filename, appliedAt)
      VALUES ('${file}', '${now}');
    `);

    console.log(`Успішно застосовано: ${file}`);
  }

  console.log("Ініціалізація схеми БД завершена.");
}
