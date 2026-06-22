// Модель користувача, як вона зберігається в базі (in-memory масиві)
export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // може бути відсутнім у деяких випадках
  role: string;
}

// DTO для створення нового користувача (POST /api/users)
export interface CreateUserRequestDto {
  username: string;
  email: string;
  password?: string;
  role: string;
}

// DTO для повного/часткового оновлення користувача (PUT/PATCH /api/users/:id)
export interface UpdateUserRequestDto {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

// DTO відповіді про користувача, яке ми віддаємо клієнту (без пароля!)
export interface UserResponseDto {
  id: string;
  username: string;
  email: string;
  role: string;
}
