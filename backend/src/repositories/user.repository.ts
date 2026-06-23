import { User } from "../dtos/user.dto";
import { all, get, run, escapeSql } from "../db/dbClient";

// Репозиторій для роботи з користувачами через SQLite (сирі SQL-запити)
export class UserRepository {
  // Допоміжна функція для мапінгу рядка з бази даних в інтерфейс User
  private mapRowToUser(row: any): User {
    return {
      id: String(row.id),
      username: row.username,
      email: row.email,
      password: row.password,
      role: row.role,
    };
  }

  // Отримати всіх користувачів
  public async findAll(): Promise<User[]> {
    const rows = await all<any>("SELECT * FROM Users ORDER BY id ASC;");
    return rows.map((row) => this.mapRowToUser(row));
  }

  // Знайти користувача за його ID
  public async findById(id: string | number): Promise<User | undefined> {
    const row = await get<any>(`SELECT * FROM Users WHERE id = ${Number(id)};`);
    if (!row) return undefined;
    return this.mapRowToUser(row);
  }

  // Знайти користувача за поштою (потрібно для перевірки унікальності)
  public async findByEmail(email: string): Promise<User | undefined> {
    const row = await get<any>(
      `SELECT * FROM Users WHERE LOWER(email) = '${escapeSql(email.trim().toLowerCase())}';`
    );
    if (!row) return undefined;
    return this.mapRowToUser(row);
  }

  // Додати нового користувача
  public async create(
    user: Omit<User, "id"> & { password?: string }
  ): Promise<User> {
    const createdAt = new Date().toISOString();
    const result = await run(`
      INSERT INTO Users (username, email, password, role, createdAt)
      VALUES (
        '${escapeSql(user.username.trim())}',
        '${escapeSql(user.email.trim())}',
        '${escapeSql(user.password || "")}',
        '${escapeSql(user.role)}',
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
  public async update(
    id: string,
    updatedFields: Partial<User>
  ): Promise<User | undefined> {
    const sets: string[] = [];

    if (updatedFields.username !== undefined) {
      sets.push(`username = '${escapeSql(updatedFields.username.trim())}'`);
    }
    if (updatedFields.email !== undefined) {
      sets.push(`email = '${escapeSql(updatedFields.email.trim())}'`);
    }
    if (updatedFields.password !== undefined) {
      sets.push(`password = '${escapeSql(updatedFields.password)}'`);
    }
    if (updatedFields.role !== undefined) {
      sets.push(`role = '${escapeSql(updatedFields.role)}'`);
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    const sql = `UPDATE Users SET ${sets.join(", ")} WHERE id = ${Number(id)};`;
    const result = await run(sql);

    if (result.changes === 0) return undefined;
    return this.findById(id);
  }

  // Видалити користувача за його ID
  public async delete(id: string): Promise<boolean> {
    const result = await run(`DELETE FROM Users WHERE id = ${Number(id)};`);
    return result.changes > 0;
  }
}
