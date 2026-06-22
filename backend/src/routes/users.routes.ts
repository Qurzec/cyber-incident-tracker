import { Router } from "express";
import { UserRepository } from "../repositories/user.repository";
import { UserService } from "../services/user.service";
import { UserController } from "../controllers/user.controller";

const router = Router();

// Ініціалізуємо шари для користувачів
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// Маршрути для /api/users
router.get("/", userController.getAll);
router.get("/:id", userController.getById);
router.post("/", userController.create);
router.put("/:id", userController.update);
router.patch("/:id", userController.patch);
router.delete("/:id", userController.delete);

export default router;
export { userRepository, userService }; // Експортуємо про всяк випадок
