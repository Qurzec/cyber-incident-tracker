// Контракти обміну даними (DTO), узгоджені з бекендом

// Опис користувача у відповідях
export interface UserResponseDto {
  id: string;
  username: string;
  email: string;
  role: string;
}

// Опис інциденту у відповідях
export interface IncidentResponseDto {
  id: string;
  date: string;
  tag: string;
  severity: string;
  reporter: string;
  comments: string;
  createdAt: number;
}

// Вхідні дані для створення нового інциденту
export interface CreateIncidentRequestDto {
  date: string;
  tag: string;
  severity: string;
  reporter: string;
  comments?: string;
}

// Вхідні дані для оновлення інциденту
export interface UpdateIncidentRequestDto {
  date?: string;
  tag?: string;
  severity?: string;
  reporter?: string;
  comments?: string;
}

// Уніфікована структура помилок для відображення в UI
export interface ApiError {
  status: number; // 0 = помилка мережі, інакше HTTP статус
  message: string;
  details?: string;
}
