"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeSql = escapeSql;
exports.all = all;
exports.get = get;
exports.run = run;
const db_1 = require("./db");
// Функція для очищення тексту від одинарних лапок, щоб SQL-запит не «ламався»
function escapeSql(s) {
    if (s === null || s === undefined)
        return "";
    return String(s).replace(/'/g, "''");
}
// Допоміжна функція для логування SQL запитів у консоль при розробці
function logSql(sql) {
    if (process.env.NODE_ENV !== "production") {
        console.log("[SQL Query]:", sql.trim().replace(/\s+/g, " "));
    }
}
// Виконання запиту SELECT, який повертає багато рядків
function all(sql) {
    logSql(sql);
    return new Promise((resolve, reject) => {
        db_1.db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}
// Виконання запиту SELECT, який повертає один рядок
function get(sql) {
    logSql(sql);
    return new Promise((resolve, reject) => {
        db_1.db.get(sql, (err, row) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(row);
            }
        });
    });
}
function run(sql) {
    logSql(sql);
    return new Promise((resolve, reject) => {
        db_1.db.run(sql, function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve({
                    lastID: this.lastID,
                    changes: this.changes,
                });
            }
        });
    });
}
