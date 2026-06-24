import { migrate } from "./migrate";
import { run } from "./dbClient";

// Функція для наповнення бази даних тестовими даними (seeding)
async function seed(): Promise<void> {
  // Переконуємося, що всі таблиці створені
  await migrate();

  const now = new Date().toISOString();

  console.log("Початок наповнення бази даних (seeding)...");

  // 1. Додаємо початкових користувачів (використовуємо INSERT OR IGNORE для уникнення дублікатів по UNIQUE)
  await run(`
    INSERT OR IGNORE INTO Users (id, username, email, password, role, createdAt)
    VALUES (
      1,
      'david_kb',
      'david@knu.ua',
      'hashed_password_123',
      'Admin',
      '${now}'
    );
  `);

  await run(`
    INSERT OR IGNORE INTO Users (id, username, email, password, role, createdAt)
    VALUES (
      2,
      'editor_olena',
      'olena@knu.ua',
      'hashed_password_456',
      'Editor',
      '${now}'
    );
  `);

  await run(`
    INSERT OR IGNORE INTO Users (id, username, email, password, role, createdAt)
    VALUES (
      3,
      'ivan_cyber',
      'ivan@knu.ua',
      'secure123',
      'User',
      '${now}'
    );
  `);

  // 2. Додаємо початкові інциденти
  await run(`
    INSERT OR IGNORE INTO Incidents (id, date, tag, severity, reporter, comments, ownerUserId, createdAt)
    VALUES (
      1,
      '2026-06-04T10:00',
      'DDoS',
      'Високий',
      'Oleksandr Shevchenko',
      'Атака на веб-сайт, зафіксовано велику кількість сміттєвого трафіку.',
      1,
      '${now}'
    );
  `);

  await run(`
    INSERT OR IGNORE INTO Incidents (id, date, tag, severity, reporter, comments, ownerUserId, createdAt)
    VALUES (
      2,
      '2026-06-04T11:15',
      'Фішинг',
      'Середній',
      'Maria Sydorenko',
      'Виявлено розсилку фішингових листів серед працівників.',
      2,
      '${now}'
    );
  `);

  // 3. Додаємо коментарі до першого інциденту
  await run(`
    INSERT OR IGNORE INTO IncidentComments (id, incidentId, userId, message, createdAt)
    VALUES (
      1,
      1,
      2,
      'DDoS-атака припинилась о 12:00. Трафік повернувся до норми.',
      '${now}'
    );
  `);

  await run(`
    INSERT OR IGNORE INTO IncidentComments (id, incidentId, userId, message, createdAt)
    VALUES (
      2,
      1,
      1,
      'Заблоковано підмережі IP-адрес надавача послуг.',
      '${now}'
    );
  `);

  console.log("Базу даних успішно наповнено тестовими даними!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Помилка під час наповнення бази даних:", err);
  process.exit(1);
});
