"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentRepository = void 0;
const dbClient_1 = require("../db/dbClient");
// Репозиторій для роботи з інцидентами через SQLite (сирі SQL-запити)
class IncidentRepository {
    // Допоміжна функція для мапінгу рядка з бази даних в інтерфейс Incident
    mapRowToIncident(row) {
        return {
            id: String(row.id),
            date: row.date,
            tag: row.tag,
            severity: row.severity,
            reporter: row.reporter,
            comments: row.comments || "",
            createdAt: new Date(row.createdAt).getTime(), // Перетворюємо рядок ISO в мілісекунди
        };
    }
    // Отримати список інцидентів з фільтрацією, сортуванням та пагінацією через SQL
    async findAll(query) {
        const conditions = [];
        // Збираємо умови фільтрації WHERE
        if (query.tag) {
            conditions.push(`LOWER(tag) = '${(0, dbClient_1.escapeSql)(query.tag.trim().toLowerCase())}'`);
        }
        if (query.severity) {
            conditions.push(`LOWER(severity) = '${(0, dbClient_1.escapeSql)(query.severity.trim().toLowerCase())}'`);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        // Отримуємо загальну кількість записів для пагінації
        const countRow = await (0, dbClient_1.get)(`SELECT COUNT(*) as count FROM Incidents ${whereClause};`);
        const total = countRow ? countRow.count : 0;
        // Визначаємо сортування з білим списком допустимих полів для безпеки
        const allowedSortFields = [
            "id",
            "date",
            "tag",
            "severity",
            "reporter",
            "createdAt",
        ];
        const sortField = allowedSortFields.includes(query.sortBy || "")
            ? query.sortBy
            : "id";
        const sortOrder = query.sortDir === "desc" ? "DESC" : "ASC";
        // Налаштовуємо ліміти пагінації
        let limitOffsetClause = "";
        if (query.page && query.pageSize) {
            const page = Math.max(1, query.page);
            const pageSize = Math.max(1, query.pageSize);
            const offset = (page - 1) * pageSize;
            limitOffsetClause = `LIMIT ${pageSize} OFFSET ${offset}`;
        }
        // Виконуємо запит вибірки
        const sql = `
      SELECT * FROM Incidents
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      ${limitOffsetClause};
    `;
        const rows = await (0, dbClient_1.all)(sql);
        const items = rows.map((row) => this.mapRowToIncident(row));
        return { items, total };
    }
    // Знайти інцидент за його ID
    async findById(id) {
        const row = await (0, dbClient_1.get)(`SELECT * FROM Incidents WHERE id = ${Number(id)};`);
        if (!row)
            return undefined;
        return this.mapRowToIncident(row);
    }
    // Додати новий інцидент
    async create(incident) {
        const createdAt = new Date().toISOString();
        const result = await (0, dbClient_1.run)(`
      INSERT INTO Incidents (date, tag, severity, reporter, comments, createdAt)
      VALUES (
        '${(0, dbClient_1.escapeSql)(incident.date.trim())}',
        '${(0, dbClient_1.escapeSql)(incident.tag.trim())}',
        '${(0, dbClient_1.escapeSql)(incident.severity.trim())}',
        '${(0, dbClient_1.escapeSql)(incident.reporter.trim())}',
        '${(0, dbClient_1.escapeSql)(incident.comments || "")}',
        '${createdAt}'
      );
    `);
        const savedIncident = await this.findById(result.lastID);
        if (!savedIncident) {
            throw new Error("Не вдалося створити інцидент у базі даних");
        }
        return savedIncident;
    }
    // Оновити дані інциденту за його ID
    async update(id, updatedFields) {
        const sets = [];
        if (updatedFields.date !== undefined) {
            sets.push(`date = '${(0, dbClient_1.escapeSql)(updatedFields.date.trim())}'`);
        }
        if (updatedFields.tag !== undefined) {
            sets.push(`tag = '${(0, dbClient_1.escapeSql)(updatedFields.tag.trim())}'`);
        }
        if (updatedFields.severity !== undefined) {
            sets.push(`severity = '${(0, dbClient_1.escapeSql)(updatedFields.severity.trim())}'`);
        }
        if (updatedFields.reporter !== undefined) {
            sets.push(`reporter = '${(0, dbClient_1.escapeSql)(updatedFields.reporter.trim())}'`);
        }
        if (updatedFields.comments !== undefined) {
            sets.push(`comments = '${(0, dbClient_1.escapeSql)(updatedFields.comments.trim())}'`);
        }
        if (sets.length === 0) {
            return this.findById(id);
        }
        const sql = `UPDATE Incidents SET ${sets.join(", ")} WHERE id = ${Number(id)};`;
        const result = await (0, dbClient_1.run)(sql);
        if (result.changes === 0)
            return undefined;
        return this.findById(id);
    }
    // Видалити інцидент за його ID
    async delete(id) {
        const result = await (0, dbClient_1.run)(`DELETE FROM Incidents WHERE id = ${Number(id)};`);
        return result.changes > 0;
    }
    // Вразливий пошук інцидентів за коментарями (навчальна вразливість SQL Injection)
    async searchVulnerable(q) {
        // Рядкове з'єднання без екранування лапок
        const sql = `SELECT * FROM Incidents WHERE comments LIKE '%${q}%' ORDER BY id DESC;`;
        const rows = await (0, dbClient_1.all)(sql);
        return rows.map((row) => this.mapRowToIncident(row));
    }
    // Отримати коментарі до інциденту (endpoint із JOIN)
    async getComments(incidentId) {
        const sql = `
      SELECT c.id, c.incidentId, c.message, c.createdAt, u.id as userId, u.username, u.email
      FROM IncidentComments c
      JOIN Users u ON c.userId = u.id
      WHERE c.incidentId = ${Number(incidentId)}
      ORDER BY c.id ASC;
    `;
        return await (0, dbClient_1.all)(sql);
    }
    // Додати коментар до інциденту
    async addComment(incidentId, userId, message) {
        const createdAt = new Date().toISOString();
        const result = await (0, dbClient_1.run)(`
      INSERT INTO IncidentComments (incidentId, userId, message, createdAt)
      VALUES (
        ${Number(incidentId)},
        ${Number(userId)},
        '${(0, dbClient_1.escapeSql)(message.trim())}',
        '${createdAt}'
      );
    `);
        return await (0, dbClient_1.get)(`
      SELECT c.id, c.incidentId, c.message, c.createdAt, u.username, u.email
      FROM IncidentComments c
      JOIN Users u ON c.userId = u.id
      WHERE c.id = ${result.lastID};
    `);
    }
    // Агрегація даних для аналітики (endpoint з COUNT / GROUP BY)
    async getAnalyticsSummary() {
        // Кількість за рівнями загрози
        const severityStats = await (0, dbClient_1.all)(`
      SELECT severity, COUNT(*) as count
      FROM Incidents
      GROUP BY severity;
    `);
        // Кількість за типами інцидентів (тегами)
        const tagStats = await (0, dbClient_1.all)(`
      SELECT tag, COUNT(*) as count
      FROM Incidents
      GROUP BY tag;
    `);
        // Загальна кількість інцидентів
        const totalRow = await (0, dbClient_1.get)(`SELECT COUNT(*) as total FROM Incidents;`);
        const total = totalRow ? totalRow.total : 0;
        return {
            total,
            bySeverity: severityStats,
            byTag: tagStats,
        };
    }
}
exports.IncidentRepository = IncidentRepository;
