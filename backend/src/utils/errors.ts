// Клас для створення помилок з HTTP статус-кодами
// Успадковує стандартний Error, щоб ми могли кидати його через throw
export class ApiError extends Error {
  public status: number; // наприклад, 400, 404, 500
  public code: string; // унікальний код помилки для клієнта (наприклад, 'VALIDATION_ERROR')
  public details: unknown; // масив деталей (корисний для помилок валідації полів)

  constructor(
    status: number,
    code: string,
    message: string,
    details: unknown = null
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;

    // Потрібно для правильної роботи instanceof в TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
