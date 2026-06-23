-- Ми створюємо індекси для підвищення швидкості пошуку, сортування та з'єднання таблиць (JOIN).
CREATE INDEX IF NOT EXISTS idx_incidents_tag ON Incidents(tag);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON Incidents(severity);
CREATE INDEX IF NOT EXISTS idx_comments_incidentId ON IncidentComments(incidentId);
CREATE INDEX IF NOT EXISTS idx_comments_userId ON IncidentComments(userId);
