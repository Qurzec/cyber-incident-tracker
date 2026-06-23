import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";

// Контролер для обробки запитів, пов'язаних з користувачами
export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  // GET /api/users - отримати всіх користувачів
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.getAllUsers();
      // Повертаємо список у стандартизованому форматі { items: [...], total: N }
      res.status(200).json({
        items: users,
        total: users.length,
      });
    } catch (err) {
      next(err);
    }
  };

  // GET /api/users/:id - отримати конкретного користувача за ID
  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id as string;
      const user = await this.userService.getUserById(userId);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  };

  // POST /api/users - створити нового користувача
  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  };

  // PUT /api/users/:id - повне оновлення даних користувача
  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id as string;
      const updatedUser = await this.userService.updateUser(
        userId,
        req.body,
        false
      );
      res.status(200).json(updatedUser);
    } catch (err) {
      next(err);
    }
  };

  // PATCH /api/users/:id - часткове оновлення даних користувача
  public patch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id as string;
      const updatedUser = await this.userService.updateUser(
        userId,
        req.body,
        true
      );
      res.status(200).json(updatedUser);
    } catch (err) {
      next(err);
    }
  };

  // DELETE /api/users/:id - видалити користувача за ID
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id as string;
      await this.userService.deleteUser(userId);
      res.status(204).end(); // 204 No Content
    } catch (err) {
      next(err);
    }
  };
}
