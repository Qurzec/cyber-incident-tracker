"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.userRepository = void 0;
const express_1 = require("express");
const user_repository_1 = require("../repositories/user.repository");
const user_service_1 = require("../services/user.service");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
// Ініціалізуємо шари для користувачів
const userRepository = new user_repository_1.UserRepository();
exports.userRepository = userRepository;
const userService = new user_service_1.UserService(userRepository);
exports.userService = userService;
const userController = new user_controller_1.UserController(userService);
// Маршрути для /api/users
router.get("/", userController.getAll);
router.get("/:id", userController.getById);
router.post("/", userController.create);
router.put("/:id", userController.update);
router.patch("/:id", userController.patch);
router.delete("/:id", userController.delete);
exports.default = router;
