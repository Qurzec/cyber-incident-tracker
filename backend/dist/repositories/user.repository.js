"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const dbClient_1 = require("../db/dbClient");
// Репозиторій для роботи з користувачами через SQLite (сирі SQL-запити)
class UserRepository {
    // Допоміжна функція для мапінгу рядка з бази даних в інтерфейс User
    mapRowToUser(row) {
        return {
            id: String(row.id),
            username: row.username,
            email: row.email,
            password: row.password,
            role: row.role,
        };
    }
    // Отримати всіх користувачів
    async findAll() {
        const rows = await (0, dbClient_1.all)("SELECT * FROM Users ORDER BY id ASC;");
        return rows.map((row) => this.mapRowToUser(row));
    }
    // Знайти користувача за його ID
    async findById(id) {
        const row = await (0, dbClient_1.get)(`SELECT * FROM Users WHERE id = ${Number(id)};`);
        if (!row)
            return undefined;
        return this.mapRowToUser(row);
    }
    // Знайти користувача за поштою (потрібно для перевірки унікальності)
    async findByEmail(email) {
        const row = await (0, dbClient_1.get)(`SELECT * FROM Users WHERE LOWER(email) = '${(0, dbClient_1.escapeSql)(email.trim().toLowerCase())}';`);
        if (!row)
            return undefined;
        return this.mapRowToUser(row);
    }
    // Додати нового користувача
    async create(user) {
        const createdAt = new Date().toISOString();
        const result = await (0, dbClient_1.run)(`
      INSERT INTO Users (username, email, password, role, createdAt)
      VALUES (
        '${(0, dbClient_1.escapeSql)(user.username.trim())}',
        '${(0, dbClient_1.escapeSql)(user.email.trim())}',
        '${(0, dbClient_1.escapeSql)(user.password || "")}',
        '${(0, dbClient_1.escapeSql)(user.role)}',
        '${createdAt}'
      );
    `);
        const savedUser = await this.findById(result.lastID);
        if (!savedUser) {
            throw new Error("Не вдалося створити користувача у базі даних");
        }
        return savedUser;
    }
    // Оновити дані користувача за його ID
    async update(id, updatedFields) {
        const sets = [];
        if (updatedFields.username !== undefined) {
            sets.push(`username = '${(0, dbClient_1.escapeSql)(updatedFields.username.trim())}'`);
        }
        if (updatedFields.email !== undefined) {
            sets.push(`email = '${(0, dbClient_1.escapeSql)(updatedFields.email.trim())}'`);
        }
        if (updatedFields.password !== undefined) {
            sets.push(`password = '${(0, dbClient_1.escapeSql)(updatedFields.password)}'`);
        }
        if (updatedFields.role !== undefined) {
            sets.push(`role = '${(0, dbClient_1.escapeSql)(updatedFields.role)}'`);
        }
        if (sets.length === 0) {
            return this.findById(id);
        }
        const sql = `UPDATE Users SET ${sets.join(", ")} WHERE id = ${Number(id)};`;
        const result = await (0, dbClient_1.run)(sql);
        if (result.changes === 0)
            return undefined;
        return this.findById(id);
    }
    // Видалити користувача за його ID
    async delete(id) {
        const result = await (0, dbClient_1.run)(`DELETE FROM Users WHERE id = ${Number(id)};`);
        return result.changes > 0;
    }
}
exports.UserRepository = UserRepository;
