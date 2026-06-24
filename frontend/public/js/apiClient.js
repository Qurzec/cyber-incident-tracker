import { API_BASE_URL } from "./config.js";
// Зберігаємо посилання на поточний AbortController для можливості скасування запиту
let activeController = null;
// Функція для ручного скасування активного запиту користувачем
export function cancelActiveRequest() {
    if (activeController) {
        activeController.abort();
        activeController = null;
    }
}
// Базова функція для виконання HTTP запитів
async function request(path, options = {}) {
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
                };
            }
            return null;
        }
        const rawText = await response.text();
        if (response.ok) {
            if (!rawText)
                return null;
            try {
                // Пробуємо розпарсити відповідь як JSON
                return JSON.parse(rawText);
            }
            catch {
                // Якщо сервер повернув звичайний текст
                return rawText;
            }
        }
        // Якщо відповідь не успішна (статус 4xx/5xx)
        let errPayload = null;
        try {
            errPayload = rawText ? JSON.parse(rawText) : null;
        }
        catch {
            // Ігноруємо помилку парсингу помилки
        }
        // Викидаємо типізовану помилку
        const apiError = {
            status: response.status,
            message: errPayload?.error?.message || errPayload?.message || "Невідома HTTP помилка",
            details: errPayload?.error?.code || rawText || `Статус відповіді: ${response.status}`,
        };
        throw apiError;
    }
    catch (err) {
        clearTimeout(timeoutId);
        activeController = null;
        // Якщо запит було скасовано через AbortController (таймаут або кнопка)
        if (err.name === "AbortError") {
            const abortError = {
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
        const netError = {
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
export async function getIncidents(params) {
    const queryParts = [];
    if (params.tag)
        queryParts.push(`tag=${encodeURIComponent(params.tag)}`);
    if (params.severity)
        queryParts.push(`severity=${encodeURIComponent(params.severity)}`);
    if (params.sortBy)
        queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
    if (params.sortDir)
        queryParts.push(`sortDir=${encodeURIComponent(params.sortDir)}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return await request(`/incidents${queryString}`, {
        method: "GET",
    });
}
// Отримати інцидент за ID
export async function getIncidentById(id) {
    return await request(`/incidents/${encodeURIComponent(id)}`, {
        method: "GET",
    });
}
// Створити інцидент
export async function createIncident(dto) {
    return await request("/incidents", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
    });
}
// Оновити інцидент (PATCH)
export async function updateIncident(id, dto) {
    return await request(`/incidents/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
    });
}
// Видалити інцидент
export async function deleteIncident(id) {
    await request(`/incidents/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
}
