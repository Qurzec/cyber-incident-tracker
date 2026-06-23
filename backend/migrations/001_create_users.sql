-- Ми створюємо таблицю Users для збереження даних користувачів.
-- Роль обмежується через CHECK констрейнт для безпеки.
CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Admin', 'User', 'Editor')),
  createdAt TEXT NOT NULL
);
