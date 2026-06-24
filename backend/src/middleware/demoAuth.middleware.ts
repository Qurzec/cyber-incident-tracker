import { Request, Response, NextFunction } from "express";
import { UserRepository } from "../repositories/user.repository";
import { User } from "../dtos/user.dto";

// Розширюємо тип Request для Express, щоб додати req.user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const userRepository = new UserRepository();

// Middleware для авторизації за допомогою заголовка X-Demo-UserId
export async function demoAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
  } catch (err) {
    next(err);
  }
}
