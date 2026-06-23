# Документація та інструкція для Backend API (Лабораторна робота №3 - Рівень "На Відмінно")

Цей проект є бекенд-частиною для трекера інцидентів кібербезпеки. У цій лабораторній роботі додано повноцінне збереження даних у базі даних **SQLite** за допомогою сирих SQL-запитів, реалізовано автоматичні міграції на старті застосунку, додано зв'язки між сутностями (JOIN), аналітичні агрегації та демонстраційний вразливий до SQL Injection маршрут.

Проект повністю написано на **TypeScript**.

---

## Схема бази даних

База даних зберігається локально у файлі `./data/app.db` (ігнорується у Git).

Схема містить 3 взаємопов'язані таблиці:

```mermaid
erDiagram
    Users ||--o{ IncidentComments : "пише"
    Incidents ||--o{ IncidentComments : "має"

    Users {
        INTEGER id PK
        TEXT username UNIQUE
        TEXT email UNIQUE
        TEXT password
        TEXT role
        TEXT createdAt
    }

    Incidents {
        INTEGER id PK
        TEXT date
        TEXT tag
        TEXT severity
        TEXT reporter
        TEXT comments
        TEXT createdAt
    }

    IncidentComments {
        INTEGER id PK
        INTEGER incidentId FK
        INTEGER userId FK
        TEXT message
        TEXT createdAt
    }
```

### Деталі таблиць та обмежень (Constraints)

1. **Користувачі (`Users`)**:
   - `id`: Первинний ключ (`INTEGER PRIMARY KEY AUTOINCREMENT`).
   - `username`: Унікальне ім'я користувача (`TEXT NOT NULL UNIQUE`).
   - `email`: Унікальна електронна пошта (`TEXT NOT NULL UNIQUE`).
   - `password`: Хеш/пароль (`TEXT NOT NULL`).
   - `role`: Роль користувача (`TEXT NOT NULL CHECK(role IN ('Admin', 'User', 'Editor'))`).
   - `createdAt`: Дата реєстрації у форматі ISO (`TEXT NOT NULL`).

2. **Інциденти (`Incidents`)**:
   - `id`: Первинний ключ (`INTEGER PRIMARY KEY AUTOINCREMENT`).
   - `date`: Дата та час події (`TEXT NOT NULL`).
   - `tag`: Тип події (`TEXT NOT NULL CHECK(tag IN ('DDoS', 'Фішинг', 'Вредоносне ПО', 'Несанкціонований доступ', 'Інше'))`).
   - `severity`: Рівень загрози (`TEXT NOT NULL CHECK(severity IN ('Низький', 'Середній', 'Високий', 'Критичний'))`).
   - `reporter`: Хто повідомив про подію (`TEXT NOT NULL`).
   - `comments`: Опис детальних обставин (`TEXT` - необов'язкове).
   - `createdAt`: ISO рядок створення (`TEXT NOT NULL`).

3. **Коментарі (`IncidentComments`)**:
   - `id`: Первинний ключ (`INTEGER PRIMARY KEY AUTOINCREMENT`).
   - `incidentId`: Зовнішній ключ (`INTEGER NOT NULL`), посилається на `Incidents.id`. При видаленні інциденту його коментарі автоматично видаляються (`ON DELETE CASCADE`).
   - `userId`: Зовнішній ключ (`INTEGER NOT NULL`), посилається на `Users.id`. Видалення користувача заблоковано, якщо він має коментарі (`ON DELETE RESTRICT`).
   - `message`: Вміст коментаря (`TEXT NOT NULL`).
   - `createdAt`: ISO рядок створення (`TEXT NOT NULL`).

### Створені індекси (Indexes)

Для оптимізації вибірок додано індекси:

- `idx_incidents_tag` на `Incidents(tag)` — прискорює фільтрацію за типом інциденту.
- `idx_incidents_severity` на `Incidents(severity)` — прискорює фільтрацію за рівнем загрози.
- `idx_comments_incidentId` на `IncidentComments(incidentId)` — прискорює з'єднання таблиць (JOIN) при отриманні коментарів до інциденту.

---

## Як запустити проект локально

Усі команди запускаються з папки `backend`:

1. **Встановлення залежностей**:

   ```bash
   npm install
   ```

2. **Ініціалізація та наповнення бази даних (Seeding)**:
   Для автоматичного створення таблиць та наповнення бази тестовими даними (користувачі, інциденти, коментарі) запустіть скрипт:

   ```bash
   npx tsx src/db/seed.ts
   ```

3. **Запуск у режимі розробки** (автоматично виконує міграції перед стартом):

   ```bash
   npm run dev
   ```

4. **Компіляція проекту**:

   ```bash
   npm run build
   ```

5. **Запуск скомпільованої версії**:
   ```bash
   npm start
   ```

---

## Додаткові REST-можливості (Рівень "На Відмінно")

### 1. Фільтрація, сортування та пагінація

Всі ці механізми перенесені на рівень бази даних за допомогою побудови динамічних `SELECT`-запитів (`WHERE`, `ORDER BY`, `LIMIT`, `OFFSET`).

Приклад запиту з фільтрацією за рівнем:

```bash
curl -i "http://localhost:3000/api/incidents?severity=Високий"
```

### 2. Отримання пов'язаних коментарів (Ендпоінт із `JOIN`)

Повертає список коментарів до конкретного інциденту з приєднанням імені та пошти авторів через зв'язок `JOIN Users`:

```bash
curl -i http://localhost:3000/api/incidents/1/comments
```

### 3. Додавання коментаря

Дозволяє додати новий коментар до інциденту від імені конкретного користувача:

```bash
curl -i -X POST http://localhost:3000/api/incidents/1/comments \
  -H "Content-Type: application/json" \
  -d '{"userId": 3, "message": "Підтверджую блокування хостів зловмисника"}'
```

### 4. Аналітичне резюме (Ендпоінт з `COUNT` та `GROUP BY`)

Повертає агреговані статистичні дані про загальну кількість інцидентів та розподіл їх за severity і tag:

```bash
curl -i http://localhost:3000/api/analytics/summary
```

---

## Інструкція та демонстрація вразливості SQL Injection

У цій роботі реалізовано вразливий пошуковий ендпоінт: `GET /api/incidents/search-vulnerable?q=...`.

Код репозиторію формує запит за допомогою безпосередньої конкатенації:

```typescript
const sql = `SELECT * FROM Incidents WHERE comments LIKE '%${q}%' ORDER BY id DESC;`;
```

### Демонстрація атаки (SQL Injection)

Якщо зловмисник введе як пошуковий запит значення, яке містить одинарну лапку та оператор `OR 1=1`, він зможе зламати логіку вибірки `WHERE`.

Приклад запиту для демонстрації:

```bash
curl -i "http://localhost:3000/api/incidents/search-vulnerable?q=%27%20OR%201=1%20--"
```

**Що відбувається під капотом:**
Сформований SQL-запит перетворюється на:

```sql
SELECT * FROM Incidents WHERE comments LIKE '%' OR 1=1 --%' ORDER BY id DESC;
```

Оскільки оператор `OR 1=1` завжди повертає `true`, база даних ігнорує початкову фільтрацію і повертає абсолютно всі записи з таблиці `Incidents`. Символи `--` коментують і відсікають решту запиту, нейтралізуючи закриваючу лапку `%`.

---

## Приклади запитів для перевірки (Users & Incidents CRUD)

### Робота з користувачами (Users API):

- **Отримати всіх користувачів:**
  ```bash
  curl -i http://localhost:3000/api/users
  ```
- **Отримати користувача за ID:**
  ```bash
  curl -i http://localhost:3000/api/users/1
  ```
- **Створити нового користувача:**
  ```bash
  curl -i -X POST http://localhost:3000/api/users \
    -H "Content-Type: application/json" \
    -d '{"username": "ivan_cyber", "email": "ivan@knu.ua", "password": "secure123", "role": "User"}'
  ```
- **Частково оновити користувача:**
  ```bash
  curl -i -X PATCH http://localhost:3000/api/users/2 \
    -H "Content-Type: application/json" \
    -d '{"role": "Admin"}'
  ```
- **Видалити користувача:**
  ```bash
  curl -i -X DELETE http://localhost:3000/api/users/3
  ```

### Робота з інцидентами (Incidents API):

- **Отримати всі інциденти:**
  ```bash
  curl -i http://localhost:3000/api/incidents
  ```
- **Створити новий інцидент:**
  ```bash
  curl -i -X POST http://localhost:3000/api/incidents \
    -H "Content-Type: application/json" \
    -d '{"date": "2026-06-04T12:00", "tag": "Вредоносне ПО", "severity": "Критичний", "reporter": "Ivan Ivanov", "comments": "Виявлено шифрувальник на робочому компютері."}'
  ```
- **Частково оновити коментар в інциденті:**
  ```bash
  curl -i -X PATCH http://localhost:3000/api/incidents/1 \
    -H "Content-Type: application/json" \
    -d '{"comments": "Оновлені деталі: DDoS-атака припинилась."}'
  ```
- **Видалити інцидент:**
  ```bash
  curl -i -X DELETE http://localhost:3000/api/incidents/2
  ```
