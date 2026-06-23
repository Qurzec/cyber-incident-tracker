import { UserRepository } from "../repositories/user.repository";
import {
  CreateUserRequestDto,
  UpdateUserRequestDto,
  User,
  UserResponseDto,
} from "../dtos/user.dto";
import { ApiError } from "../utils/errors";

// Сервіс для бізнес-логіки користувачів (валідація та зв'язок з репозиторієм)
export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  // Перетворити модель користувача у DTO відповіді (ховати пароль)
  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  // Отримати список усіх користувачів
  public async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll();
    return users.map((u) => this.toResponseDto(u));
  }

  // Отримати користувача за ID
  public async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ApiError(
        404,
        "USER_NOT_FOUND",
        `Користувача з ID ${id} не знайдено`
      );
    }
    return this.toResponseDto(user);
  }

  // Створити нового користувача з валідацією полів
  public async createUser(dto: CreateUserRequestDto): Promise<UserResponseDto> {
    const validationErrors: { field: string; message: string }[] = [];

    // Валідація імені користувача
    if (!dto.username || dto.username.trim() === "") {
      validationErrors.push({
        field: "username",
        message: "Ім'я користувача обов'язкове",
      });
    } else if (dto.username.length < 3) {
      validationErrors.push({
        field: "username",
        message: "Ім'я має бути не менше 3 символів",
      });
    }

    // Валідація email
    if (!dto.email || dto.email.trim() === "") {
      validationErrors.push({ field: "email", message: "Email обов'язковий" });
    } else if (!dto.email.trim().endsWith("@knu.ua")) {
      validationErrors.push({
        field: "email",
        message: "Дозволені лише адреси домену knu.ua",
      });
    }

    // Валідація пароля
    if (!dto.password || dto.password.trim() === "") {
      validationErrors.push({
        field: "password",
        message: "Пароль обов'язковий",
      });
    } else if (dto.password.length < 6) {
      validationErrors.push({
        field: "password",
        message: "Пароль має бути не менше 6 символів",
      });
    }

    // Валідація ролі
    const allowedRoles = ["Admin", "User", "Editor"];
    if (!dto.role || dto.role.trim() === "") {
      validationErrors.push({ field: "role", message: "Роль обов'язкова" });
    } else if (!allowedRoles.includes(dto.role)) {
      validationErrors.push({
        field: "role",
        message: `Дозволені ролі: ${allowedRoles.join(", ")}`,
      });
    }

    // Валідація унікальності пошти (викликаємо асинхронний пошук)
    if (dto.email && dto.email.trim() !== "") {
      const existingUser = await this.userRepository.findByEmail(
        dto.email.trim()
      );
      if (existingUser) {
        validationErrors.push({
          field: "email",
          message: "Цей email вже зареєстрований",
        });
      }
    }

    // Якщо є якісь помилки - викидаємо 400 Bad Request
    if (validationErrors.length > 0) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Помилка валідації полів користувача",
        validationErrors
      );
    }

    const newUser = {
      username: dto.username.trim(),
      email: dto.email.trim(),
      password: dto.password,
      role: dto.role,
    };

    const savedUser = await this.userRepository.create(newUser);
    return this.toResponseDto(savedUser);
  }

  // Оновити користувача за його ID (повне або часткове оновлення)
  public async updateUser(
    id: string,
    dto: UpdateUserRequestDto,
    isPartial = false
  ): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new ApiError(
        404,
        "USER_NOT_FOUND",
        `Користувача з ID ${id} не знайдено для оновлення`
      );
    }

    const validationErrors: { field: string; message: string }[] = [];

    // При повному оновленні (PUT) обов'язкові поля перевіряються завжди.
    // При частковому (PATCH) перевіряються тільки ті поля, що передані в dto.

    // Перевірка імені
    if (!isPartial || dto.username !== undefined) {
      if (!dto.username || dto.username.trim() === "") {
        validationErrors.push({
          field: "username",
          message: "Ім'я користувача обов'язкове",
        });
      } else if (dto.username.length < 3) {
        validationErrors.push({
          field: "username",
          message: "Ім'я має бути не менше 3 символів",
        });
      }
    }

    // Перевірка email
    if (!isPartial || dto.email !== undefined) {
      if (!dto.email || dto.email.trim() === "") {
        validationErrors.push({
          field: "email",
          message: "Email обов'язковий",
        });
      } else if (!dto.email.trim().endsWith("@knu.ua")) {
        validationErrors.push({
          field: "email",
          message: "Дозволені лише адреси домену knu.ua",
        });
      }
    }

    // Перевірка пароля
    if (!isPartial || dto.password !== undefined) {
      if (!dto.password || dto.password.trim() === "") {
        validationErrors.push({
          field: "password",
          message: "Пароль обов'язковий",
        });
      } else if (dto.password.length < 6) {
        validationErrors.push({
          field: "password",
          message: "Пароль має бути не менше 6 символів",
        });
      }
    }

    // Перевірка ролі
    if (!isPartial || dto.role !== undefined) {
      const allowedRoles = ["Admin", "User", "Editor"];
      if (!dto.role || dto.role.trim() === "") {
        validationErrors.push({ field: "role", message: "Роль обов'язкова" });
      } else if (!allowedRoles.includes(dto.role)) {
        validationErrors.push({
          field: "role",
          message: `Дозволені ролі: ${allowedRoles.join(", ")}`,
        });
      }
    }

    // Перевірка унікальності пошти
    if (dto.email && dto.email.trim() !== "") {
      const userWithEmail = await this.userRepository.findByEmail(
        dto.email.trim()
      );
      if (userWithEmail && userWithEmail.id !== id) {
        validationErrors.push({
          field: "email",
          message: "Цей email вже зайнятий іншим користувачем",
        });
      }
    }

    if (validationErrors.length > 0) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Помилка валідації при оновленні користувача",
        validationErrors
      );
    }

    // Зливаємо поля відповідно до типу оновлення
    const fieldsToUpdate: Partial<User> = {};
    if (dto.username !== undefined)
      fieldsToUpdate.username = dto.username.trim();
    if (dto.email !== undefined) fieldsToUpdate.email = dto.email.trim();
    if (dto.password !== undefined) fieldsToUpdate.password = dto.password;
    if (dto.role !== undefined) fieldsToUpdate.role = dto.role;

    const updatedUser = await this.userRepository.update(id, fieldsToUpdate);
    if (!updatedUser) {
      throw new ApiError(
        500,
        "INTERNAL_SERVER_ERROR",
        "Не вдалося оновити користувача"
      );
    }

    return this.toResponseDto(updatedUser);
  }

  // Видалити користувача за його ID
  public async deleteUser(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new ApiError(
        404,
        "USER_NOT_FOUND",
        `Користувача з ID ${id} не знайдено для видалення`
      );
    }
  }
}
