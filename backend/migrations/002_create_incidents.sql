-- Ми створюємо таблицю Incidents для трекера інцидентів.
-- Поля tag та severity обмежені CHECK констрейнтами згідно з бізнес-логікою.
CREATE TABLE IF NOT EXISTS Incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  tag TEXT NOT NULL CHECK(tag IN ('DDoS', 'Фішинг', 'Вредоносне ПО', 'Несанкціонований доступ', 'Інше')),
  severity TEXT NOT NULL CHECK(severity IN ('Низький', 'Середній', 'Високий', 'Критичний')),
  reporter TEXT NOT NULL,
  comments TEXT,
  createdAt TEXT NOT NULL
);
