"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoAuthMiddleware = demoAuthMiddleware;
const user_repository_1 = require("../repositories/user.repository");
const userRepository = new user_repository_1.UserRepository();
// Middleware для авторизації за допомогою заголовка X-Demo-UserId
async function demoAuthMiddleware(req, res, next) {
    try {
        const userIdHeader = req.headers["x-demo-userid"];
        if (!userIdHeader) {
            return res.status(401).json({
                error: {
                    code: "UNAUTHORIZED",
                    message: "Користувач не авторизований. Вкажіть заголовок X-Demo-UserId.",
                },
            });
        }
        const userId = Number(userIdHeader);
        if (isNaN(userId)) {
            return res.status(401).json({
                error: {
                    code: "UNAUTHORIZED",
                    message: "Неправильний формат X-Demo-UserId.",
                },
            });
        }
        const user = await userRepository.findById(userId);
        if (!user) {
            return res.status(401).json({
                error: {
                    code: "UNAUTHORIZED",
                    message: "Користувача не знайдено в базі даних.",
                },
            });
        }
        // Зберігаємо поточного користувача у запиті
        req.user = user;
        next();
    }
    catch (err) {
        next(err);
    }
}
