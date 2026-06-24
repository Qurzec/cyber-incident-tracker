import { Incident } from "../dtos/incident.dto";
import { all, get, run, escapeSql } from "../db/dbClient";

// Репозиторій для роботи з інцидентами через SQLite (сирі SQL-запити)
export class IncidentRepository {
  // Допоміжна функція для мапінгу рядка з бази даних в інтерфейс Incident
  private mapRowToIncident(row: any): Incident {
    return {
      id: String(row.id),
      date: row.date,
      tag: row.tag,
      severity: row.severity,
      reporter: row.reporter,
      comments: row.comments || "",
      createdAt: new Date(row.createdAt).getTime(), // Перетворюємо рядок ISO в мілісекунди
      ownerUserId: Number(row.ownerUserId),
    };
  }

  // Отримати список інцидентів з фільтрацією, сортуванням та пагінацією через SQL
  public async findAll(query: {
    tag?: string;
    severity?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
  }): Promise<{ items: Incident[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];

    // Збираємо умови фільтрації WHERE
    if (query.tag) {
      conditions.push("LOWER(tag) = ?");
      params.push(query.tag.trim().toLowerCase());
    }
    if (query.severity) {
      conditions.push("LOWER(severity) = ?");
      params.push(query.severity.trim().toLowerCase());
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Отримуємо загальну кількість записів для пагінації
    const countRow = await get<{ count: number }>(
      `SELECT COUNT(*) as count FROM Incidents ${whereClause};`,
      params
    );
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

    const rows = await all<any>(sql, params);
    const items = rows.map((row) => this.mapRowToIncident(row));

    return { items, total };
  }

  // Знайти інцидент за його ID
  public async findById(id: string | number): Promise<Incident | undefined> {
    const row = await get<any>(
      "SELECT * FROM Incidents WHERE id = ?;",
      [Number(id)]
    );
    if (!row) return undefined;
    return this.mapRowToIncident(row);
  }

  // Додати новий інцидент
  public async create(
    incident: Omit<Incident, "id" | "createdAt">
  ): Promise<Incident> {
    const createdAt = new Date().toISOString();
    const result = await run(
      `INSERT INTO Incidents (date, tag, severity, reporter, comments, ownerUserId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        incident.date.trim(),
        incident.tag.trim(),
        incident.severity.trim(),
        incident.reporter.trim(),
        incident.comments || "",
        incident.ownerUserId,
        createdAt,
      ]
    );

    const savedIncident = await this.findById(result.lastID);
    if (!savedIncident) {
      throw new Error("Не вдалося створити інцидент у базі даних");
    }
    return savedIncident;
  }

  // Оновити дані інциденту за його ID
  public async update(
    id: string,
    updatedFields: Partial<Incident>
  ): Promise<Incident | undefined> {
    const sets: string[] = [];
    const params: any[] = [];

    if (updatedFields.date !== undefined) {
      sets.push("date = ?");
      params.push(updatedFields.date.trim());
    }
    if (updatedFields.tag !== undefined) {
      sets.push("tag = ?");
      params.push(updatedFields.tag.trim());
    }
    if (updatedFields.severity !== undefined) {
      sets.push("severity = ?");
      params.push(updatedFields.severity.trim());
    }
    if (updatedFields.reporter !== undefined) {
      sets.push("reporter = ?");
      params.push(updatedFields.reporter.trim());
    }
    if (updatedFields.comments !== undefined) {
      sets.push("comments = ?");
      params.push(updatedFields.comments.trim());
    }
    if (updatedFields.ownerUserId !== undefined) {
      sets.push("ownerUserId = ?");
      params.push(updatedFields.ownerUserId);
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    params.push(Number(id));
    const sql = `UPDATE Incidents SET ${sets.join(", ")} WHERE id = ?;`;
    const result = await run(sql, params);

    if (result.changes === 0) return undefined;
    return this.findById(id);
  }

  // Видалити інцидент за його ID
  public async delete(id: string): Promise<boolean> {
    const result = await run("DELETE FROM Incidents WHERE id = ?;", [Number(id)]);
    return result.changes > 0;
  }

  // Безпечний пошук інцидентів за коментарями (виправлено вразливість SQL Injection)
  public async searchVulnerable(q: string): Promise<Incident[]> {
    const sql = "SELECT * FROM Incidents WHERE comments LIKE ? ORDER BY id DESC;";
    const rows = await all<any>(sql, [`%${q}%`]);
    return rows.map((row) => this.mapRowToIncident(row));
  }

  // Отримати коментарі до інциденту (endpoint із JOIN)
  public async getComments(incidentId: string | number): Promise<any[]> {
    const sql = `
      SELECT c.id, c.incidentId, c.message, c.createdAt, u.id as userId, u.username, u.email
      FROM IncidentComments c
      JOIN Users u ON c.userId = u.id
      WHERE c.incidentId = ?
      ORDER BY c.id ASC;
    `;
    return await all<any>(sql, [Number(incidentId)]);
  }

  // Додати коментар до інциденту
  public async addComment(
    incidentId: string | number,
    userId: string | number,
    message: string
  ): Promise<any> {
    const createdAt = new Date().toISOString();
    const result = await run(
      `INSERT INTO IncidentComments (incidentId, userId, message, createdAt)
       VALUES (?, ?, ?, ?);`,
      [
        Number(incidentId),
        Number(userId),
        message.trim(),
        createdAt,
      ]
    );

    return await get<any>(
      `SELECT c.id, c.incidentId, c.message, c.createdAt, u.username, u.email
       FROM IncidentComments c
       JOIN Users u ON c.userId = u.id
       WHERE c.id = ?;`,
      [result.lastID]
    );
  }

  // Агрегація даних для аналітики (endpoint з COUNT / GROUP BY)
  public async getAnalyticsSummary(): Promise<any> {
    // Кількість за рівнями загрози
    const severityStats = await all<any>(`
      SELECT severity, COUNT(*) as count
      FROM Incidents
      GROUP BY severity;
    `);

    // Кількість за типами інцидентів (тегами)
    const tagStats = await all<any>(`
      SELECT tag, COUNT(*) as count
      FROM Incidents
      GROUP BY tag;
    `);

    // Загальна кількість інцидентів
    const totalRow = await get<any>("SELECT COUNT(*) as total FROM Incidents;");
    const total = totalRow ? totalRow.total : 0;

    return {
      total,
      bySeverity: severityStats,
      byTag: tagStats,
    };
  }
}

