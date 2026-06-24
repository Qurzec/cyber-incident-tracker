import { API_BASE_URL } from "./config.js";
import { ApiError } from "./dtos.js";

// Зберігаємо посилання на поточний AbortController для можливості скасування запиту
let activeController: AbortController | null = null;

// Функція для ручного скасування активного запиту користувачем
export function cancelActiveRequest(): void {
  if (activeController) {
    activeController.abort();
    activeController = null;
  }
}

// Базова функція для виконання HTTP запитів
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Якщо є попередній активний запит - скасовуємо його
  cancelActiveRequest();

  // Створюємо новий контролер та таймаут на 10 секунд (Рівень "На Відмінно")
  activeController = new AbortController();
  const timeoutMs = 10000;
  const timeoutId = setTimeout(() => {
    if (activeController) {
      activeController.abort();
    }
  }, timeoutMs);

  const url = `${API_BASE_URL}${path}`;

  // Отримуємо поточного користувача з localStorage для IDOR перевірок
  const currentUserId = localStorage.getItem("demoUserId") || "1";
  const headers = new Headers(options.headers || {});
  headers.set("X-Demo-UserId", currentUserId);
  options.headers = headers;

  // Показуємо у консолі деталі запиту
  console.log(`[API Request]: ${options.method || "GET"} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      signal: activeController.signal,
    });

    // Очищаємо таймаут після успішного підключення
    clearTimeout(timeoutId);
    activeController = null;

    // Специфічна обробка статусу 204 No Content
    if (response.status === 204) {
      if (!response.ok) {
        throw {
          status: response.status,
          message: "Помилка сервера",
          details: "Сервер повернув статус 204 (No Content), але запит не успішний",
        } as ApiError;
      }
      return null as unknown as T;
    }

    const rawText = await response.text();

    if (response.ok) {
      if (!rawText) return null as unknown as T;
      try {
        // Пробуємо розпарсити відповідь як JSON
        return JSON.parse(rawText) as T;
      } catch {
        // Якщо сервер повернув звичайний текст
        return rawText as unknown as T;
      }
    }

    // Якщо відповідь не успішна (статус 4xx/5xx)
    let errPayload: any = null;
    try {
      errPayload = rawText ? JSON.parse(rawText) : null;
    } catch {
      // Ігноруємо помилку парсингу помилки
    }

    // Викидаємо типізовану помилку
    const apiError: ApiError = {
      status: response.status,
      message: errPayload?.error?.message || errPayload?.message || "Невідома HTTP помилка",
      details: errPayload?.error?.code || rawText || `Статус відповіді: ${response.status}`,
    };
    throw apiError;

  } catch (err: any) {
    clearTimeout(timeoutId);
    activeController = null;

    // Якщо запит було скасовано через AbortController (таймаут або кнопка)
    if (err.name === "AbortError") {
      const abortError: ApiError = {
        status: 0,
        message: "Запит скасовано або перевищено таймаут",
        details: "Час очікування відповіді від сервера (10с) вичерпано, або ви самостійно перервали запит.",
      };
      throw abortError;
    }

    // Якщо це вже сформована нами ApiError
    if (err.status !== undefined) {
      throw err;
    }

    // Мережеві помилки (наприклад, сервер вимкнено або заблоковано CORS)
    const netError: ApiError = {
      status: 0,
      message: "Помилка підключення (Мережа або CORS)",
      details: err.message || "Сервер недоступний або запит заблоковано політикою CORS браузера.",
    };
    throw netError;
  }
}

// ----------------------------------------------------
// Методи для роботи з сутністю Інциденти
// ----------------------------------------------------

// Отримати список інцидентів з параметрами фільтрації/сортування
export async function getIncidents(params: {
  tag?: string;
  severity?: string;
  sortBy?: string;
  sortDir?: string;
}): Promise<{ items: any[]; total: number }> {
  const queryParts: string[] = [];
  if (params.tag) queryParts.push(`tag=${encodeURIComponent(params.tag)}`);
  if (params.severity) queryParts.push(`severity=${encodeURIComponent(params.severity)}`);
  if (params.sortBy) queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
  if (params.sortDir) queryParts.push(`sortDir=${encodeURIComponent(params.sortDir)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  return await request<{ items: any[]; total: number }>(`/incidents${queryString}`, {
    method: "GET",
  });
}

// Отримати інцидент за ID
export async function getIncidentById(id: string): Promise<any> {
  return await request<any>(`/incidents/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

// Створити інцидент
export async function createIncident(dto: any): Promise<any> {
  return await request<any>("/incidents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });
}

// Оновити інцидент (PATCH)
export async function updateIncident(id: string, dto: any): Promise<any> {
  return await request<any>(`/incidents/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });
}

// Видалити інцидент
export async function deleteIncident(id: string): Promise<void> {
  await request<void>(`/incidents/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
