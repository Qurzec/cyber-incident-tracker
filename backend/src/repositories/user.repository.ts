import { User } from "../dtos/user.dto";

// Репозиторій для роботи з користувачами в оперативній пам'яті (in-memory)
export class UserRepository {
  // Початкові тестові дані
  private users: User[] = [
    {
      id: "1717500000001",
      username: "david_kb",
      email: "david@knu.ua",
      password: "hashed_password_123",
      role: "Admin",
    },
    {
      id: "1717500000002",
      username: "editor_olena",
      email: "olena@knu.ua",
      password: "hashed_password_456",
      role: "Editor",
    },
  ];

  // Отримати всіх користувачів
  public findAll(): User[] {
    return this.users;
  }

  // Знайти користувача за його ID
  public findById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  // Знайти користувача за поштою (потрібно для перевірки унікальності)
  public findByEmail(email: string): User | undefined {
    return this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  // Додати нового користувача
  public create(user: User): User {
    this.users.push(user);
    return user;
  }

  // Оновити дані користувача за його ID
  public update(id: string, updatedFields: Partial<User>): User | undefined {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;

    // Зливаємо поточні дані користувача з новими полями
    this.users[index] = {
      ...this.users[index],
      ...updatedFields,
      id, // гарантуємо, що ID не зміниться
    };

    return this.users[index];
  }

  // Видалити користувача за його ID
  public delete(id: string): boolean {
    const initialLength = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    return this.users.length < initialLength;
  }
}
