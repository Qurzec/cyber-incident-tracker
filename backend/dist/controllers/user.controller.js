"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
// Контролер для обробки запитів, пов'язаних з користувачами
class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    // GET /api/users - отримати всіх користувачів
    getAll = async (req, res, next) => {
        try {
            const users = await this.userService.getAllUsers();
            // Повертаємо список у стандартизованому форматі { items: [...], total: N }
            res.status(200).json({
                items: users,
                total: users.length,
            });
        }
        catch (err) {
            next(err);
        }
    };
    // GET /api/users/:id - отримати конкретного користувача за ID
    getById = async (req, res, next) => {
        try {
            const userId = req.params.id;
            const user = await this.userService.getUserById(userId);
            res.status(200).json(user);
        }
        catch (err) {
            next(err);
        }
    };
    // POST /api/users - створити нового користувача
    create = async (req, res, next) => {
        try {
            const user = await this.userService.createUser(req.body);
            res.status(201).json(user);
        }
        catch (err) {
            next(err);
        }
    };
    // PUT /api/users/:id - повне оновлення даних користувача
    update = async (req, res, next) => {
        try {
            const userId = req.params.id;
            const updatedUser = await this.userService.updateUser(userId, req.body, false);
            res.status(200).json(updatedUser);
        }
        catch (err) {
            next(err);
        }
    };
    // PATCH /api/users/:id - часткове оновлення даних користувача
    patch = async (req, res, next) => {
        try {
            const userId = req.params.id;
            const updatedUser = await this.userService.updateUser(userId, req.body, true);
            res.status(200).json(updatedUser);
        }
        catch (err) {
            next(err);
        }
    };
    // DELETE /api/users/:id - видалити користувача за ID
    delete = async (req, res, next) => {
        try {
            const userId = req.params.id;
            await this.userService.deleteUser(userId);
            res.status(204).end(); // 204 No Content
        }
        catch (err) {
            next(err);
        }
    };
}
exports.UserController = UserController;
