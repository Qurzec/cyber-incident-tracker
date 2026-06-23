import { db } from "./db";

// Функція для очищення тексту від одинарних лапок, щоб SQL-запит не «ламався»
export function escapeSql(s: any): string {
  if (s === null || s === undefined) return "";
  return String(s).replace(/'/g, "''");
}

// Допоміжна функція для логування SQL запитів у консоль при розробці
function logSql(sql: string): void {
  if (process.env.NODE_ENV !== "production") {
    console.log("[SQL Query]:", sql.trim().replace(/\s+/g, " "));
  }
}

// Виконання запиту SELECT, який повертає багато рядків
export function all<T>(sql: string): Promise<T[]> {
  logSql(sql);
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
}

// Виконання запиту SELECT, який повертає один рядок
export function get<T>(sql: string): Promise<T | undefined> {
  logSql(sql);
  return new Promise((resolve, reject) => {
    db.get(sql, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T | undefined);
      }
    });
  });
}

// Виконання запитів типу INSERT, UPDATE, DELETE
export interface RunResult {
  lastID: number;
  changes: number;
}

export function run(sql: string): Promise<RunResult> {
  logSql(sql);
  return new Promise((resolve, reject) => {
    db.run(sql, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes,
        });
      }
    });
  });
}
