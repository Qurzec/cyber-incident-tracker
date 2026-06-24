// Модель інциденту, як вона зберігається в пам'яті
export interface Incident {
  id: string;
  date: string;
  tag: string;
  severity: string;
  reporter: string;
  comments: string;
  createdAt: number;
  ownerUserId: number; // Власник інциденту
}

// DTO для створення нового інциденту (POST /api/incidents)
export interface CreateIncidentRequestDto {
  date: string;
  tag: string;
  severity: string;
  reporter: string;
  comments?: string;
  ownerUserId?: number; // Може передаватися або вираховуватися з auth
}

// DTO для оновлення інциденту (PUT/PATCH /api/incidents/:id)
export interface UpdateIncidentRequestDto {
  date?: string;
  tag?: string;
  severity?: string;
  reporter?: string;
  comments?: string;
}

// DTO відповіді про інцидент, яке віддаємо назовні
export interface IncidentResponseDto {
  id: string;
  date: string;
  tag: string;
  severity: string;
  reporter: string;
  comments: string;
  createdAt: number;
  ownerUserId: number; // Власник інциденту
}
