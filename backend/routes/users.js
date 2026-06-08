const express = require('express');
const router = express.Router();
const ApiError = require('../utils/errors');

// База даних користувачів в пам'яті (in-memory)
let users = [
    {
        id: '1717500000001',
        username: 'david_kb',
        email: 'david@knu.ua',
        password: 'hashed_password_123',
        role: 'Admin'
    },
    {
        id: '1717500000002',
        username: 'editor_olena',
        email: 'olena@knu.ua',
        password: 'hashed_password_456',
        role: 'Editor'
    }
];

// Мапер для формування DTO відповіді (приховуємо пароль)
function toResponseDto(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    };
}

// GET /api/users - отримати список користувачів
router.get('/', (req, res, next) => {
    try {
        const responseData = users.map(user => toResponseDto(user));
        res.status(200).json(responseData);
    } catch (err) {
        next(err);
    }
});

// GET /api/users/:id - отримати одного користувача за ID
router.get('/:id', (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = users.find(u => u.id === userId);

        if (!user) {
            throw new ApiError(404, 'USER_NOT_FOUND', `Користувача з ID ${userId} не знайдено`);
        }

        res.status(200).json(toResponseDto(user));
    } catch (err) {
        next(err);
    }
});

// POST /api/users - створити нового користувача
router.post('/', (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;
        const validationErrors = [];

        // Перевірка імені
        if (!username || username.trim() === '') {
            validationErrors.push({ field: 'username', message: 'Ім\'я користувача обов\'язкове' });
        } else if (username.length < 3) {
            validationErrors.push({ field: 'username', message: 'Ім\'я має бути не менше 3 символів' });
        }

        // Перевірка пошти
        if (!email || email.trim() === '') {
            validationErrors.push({ field: 'email', message: 'Email обов\'язковий' });
        } else if (!email.trim().endsWith('@knu.ua')) {
            validationErrors.push({ field: 'email', message: 'Дозволені лише адреси домену knu.ua' });
        }

        // Перевірка пароля
        if (!password || password.trim() === '') {
            validationErrors.push({ field: 'password', message: 'Пароль обов\'язковий' });
        } else if (password.length < 6) {
            validationErrors.push({ field: 'password', message: 'Пароль має бути не менше 6 символів' });
        }

        // Перевірка ролі
        const allowedRoles = ['Admin', 'User', 'Editor'];
        if (!role || role.trim() === '') {
            validationErrors.push({ field: 'role', message: 'Роль обов\'язкова' });
        } else if (!allowedRoles.includes(role)) {
            validationErrors.push({ field: 'role', message: `Дозволені ролі: ${allowedRoles.join(', ')}` });
        }

        // Перевірка унікальності пошти
        if (email && users.some(u => u.email === email.trim())) {
            validationErrors.push({ field: 'email', message: 'Цей email вже зареєстрований' });
        }

        if (validationErrors.length > 0) {
            throw new ApiError(400, 'VALIDATION_ERROR', 'Помилка валідації полів користувача', validationErrors);
        }

        const newUser = {
            id: Date.now().toString(),
            username: username.trim(),
            email: email.trim(),
            password: password,
            role: role
        };

        users.push(newUser);
        res.status(201).json(toResponseDto(newUser));
    } catch (err) {
        next(err);
    }
});

// PUT /api/users/:id - оновити користувача
router.put('/:id', (req, res, next) => {
    try {
        const userId = req.params.id;
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new ApiError(404, 'USER_NOT_FOUND', `Користувача з ID ${userId} не знайдено для оновлення`);
        }

        const { username, email, password, role } = req.body;
        const validationErrors = [];

        if (!username || username.trim() === '') {
            validationErrors.push({ field: 'username', message: 'Ім\'я користувача обов\'язкове' });
        } else if (username.length < 3) {
            validationErrors.push({ field: 'username', message: 'Ім\'я має бути не менше 3 символів' });
        }

        if (!email || email.trim() === '') {
            validationErrors.push({ field: 'email', message: 'Email обов\'язковий' });
        } else if (!email.trim().endsWith('@knu.ua')) {
            validationErrors.push({ field: 'email', message: 'Дозволені лише адреси домену knu.ua' });
        }

        if (!password || password.trim() === '') {
            validationErrors.push({ field: 'password', message: 'Пароль обов\'язковий' });
        } else if (password.length < 6) {
            validationErrors.push({ field: 'password', message: 'Пароль має бути не менше 6 символів' });
        }

        const allowedRoles = ['Admin', 'User', 'Editor'];
        if (!role || role.trim() === '') {
            validationErrors.push({ field: 'role', message: 'Роль обов\'язкова' });
        } else if (!allowedRoles.includes(role)) {
            validationErrors.push({ field: 'role', message: `Дозволені ролі: ${allowedRoles.join(', ')}` });
        }

        if (email && users.some(u => u.email === email.trim() && u.id !== userId)) {
            validationErrors.push({ field: 'email', message: 'Цей email вже зайнятий іншим користувачем' });
        }

        if (validationErrors.length > 0) {
            throw new ApiError(400, 'VALIDATION_ERROR', 'Помилка валідації при оновленні користувача', validationErrors);
        }

        users[userIndex] = {
            id: userId,
            username: username.trim(),
            email: email.trim(),
            password: password,
            role: role
        };

        res.status(200).json(toResponseDto(users[userIndex]));
    } catch (err) {
        next(err);
    }
});

// DELETE /api/users/:id - видалити користувача
router.delete('/:id', (req, res, next) => {
    try {
        const userId = req.params.id;
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new ApiError(404, 'USER_NOT_FOUND', `Користувача з ID ${userId} не знайдено для видалення`);
        }

        users.splice(userIndex, 1);
        res.status(204).end();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
