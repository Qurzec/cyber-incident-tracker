-- Ми створюємо таблицю IncidentComments для збереження коментарів до інцидентів.
-- Вона пов'язана з інцидентом (ON DELETE CASCADE) та з автором-користувачем (ON DELETE RESTRICT).
CREATE TABLE IF NOT EXISTS IncidentComments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incidentId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  message TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (incidentId) REFERENCES Incidents(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE RESTRICT
);
