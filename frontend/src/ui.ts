import { IncidentResponseDto, ApiError } from "./dtos.js";

// Посилання на DOM-елементи
export const getElements = () => ({
  incidentForm: document.getElementById("incidentForm") as HTMLFormElement,
  incidentList: document.getElementById("incidentList") as HTMLTableSectionElement,
  submitBtn: document.getElementById("submitBtn") as HTMLButtonElement,
  cancelEditBtn: document.getElementById("cancelEditBtn") as HTMLButtonElement,
  formTitle: document.getElementById("formTitle") as HTMLHeadingElement,
  formSection: document.getElementById("formSection") as HTMLDivElement,
  
  // Поля форми
  incidentDate: document.getElementById("incidentDate") as HTMLInputElement,
  incidentTag: document.getElementById("incidentTag") as HTMLSelectElement,
  incidentSeverity: document.getElementById("incidentSeverity") as HTMLSelectElement,
  incidentReporter: document.getElementById("incidentReporter") as HTMLInputElement,
  incidentComments: document.getElementById("incidentComments") as HTMLTextAreaElement,
  incidentCancelContainer: document.getElementById("incidentCancelContainer") as HTMLDivElement,
  abortBtn: document.getElementById("abortBtn") as HTMLButtonElement,

  // Елементи фільтрації
  searchReporter: document.getElementById("searchReporter") as HTMLInputElement,
  filterTag: document.getElementById("filterTag") as HTMLSelectElement,
  sortDate: document.getElementById("sortDate") as HTMLSelectElement,

  // Глобальні контейнери
  errorBannerContainer: document.getElementById("errorBannerContainer") as HTMLDivElement,
  notice: document.getElementById("notice") as HTMLDivElement,
});

// Функція показу помилки під конкретним полем форми
export function showError(inputId: string, errorId: string, message: string): void {
  const inputEl = document.getElementById(inputId);
  const errorEl = document.getElementById(errorId);
  if (inputEl) inputEl.classList.add("invalid");
  if (errorEl) errorEl.textContent = message;
}

// Очищення помилки з поля
export function clearError(inputId: string, errorId: string): void {
  const inputEl = document.getElementById(inputId);
  const errorEl = document.getElementById(errorId);
  if (inputEl) inputEl.classList.remove("invalid");
  if (errorEl) errorEl.textContent = "";
}

// Очищення всіх помилок форми
export function clearErrors(): void {
  clearError("incidentDate", "dateError");
  clearError("incidentTag", "tagError");
  clearError("incidentSeverity", "severityError");
  clearError("incidentReporter", "reporterError");
  clearError("incidentComments", "commentsError");
}

// Дозволити або заблокувати форму (Рівень "На Добре/Відмінно")
export function setFormEnabled(enabled: boolean): void {
  const els = getElements();
  
  els.incidentDate.disabled = !enabled;
  els.incidentTag.disabled = !enabled;
  els.incidentSeverity.disabled = !enabled;
  els.incidentReporter.disabled = !enabled;
  els.incidentComments.disabled = !enabled;
  els.submitBtn.disabled = !enabled;
  
  if (els.cancelEditBtn) {
    els.cancelEditBtn.disabled = !enabled;
  }

  // Показуємо чи приховуємо кнопку скасування запиту
  if (els.incidentCancelContainer) {
    els.incidentCancelContainer.style.display = enabled ? "none" : "block";
  }
}

// Показ спливаючого повідомлення (Toast notification)
export function showNotice(text: string, isError = false): void {
  const els = getElements();
  if (!els.notice) return;

  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "toast-error" : ""}`;
  toast.textContent = text;

  els.notice.appendChild(toast);

  // Видаляємо повідомлення через 4 секунди
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// Глобальний вивід помилки підключення (CORS або офлайн) у вигляді банера
export function renderGlobalError(error: ApiError | null): void {
  const els = getElements();
  if (!els.errorBannerContainer) return;

  if (error === null) {
    els.errorBannerContainer.innerHTML = "";
    return;
  }

  els.errorBannerContainer.innerHTML = `
    <div class="error-banner">
      <h3>Помилка з'єднання з API (Код: ${error.status})</h3>
      <p><b>Опис:</b> ${error.message}</p>
      <p><b>Деталі:</b> ${error.details || "Немає додаткових деталей від сервера. Перевірте, чи запущено бекенд на порту 3000 та чи налаштовано CORS."}</p>
    </div>
  `;
}

// Рендеринг стану LOADING у таблиці
export function renderLoading(): void {
  const els = getElements();
  els.incidentList.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; color: #7f8c8d; padding: 30px 10px;">
        Завантаження даних з сервера... <div class="spinner"></div>
      </td>
    </tr>
  `;
}

// Рендеринг стану EMPTY у таблиці
export function renderEmpty(): void {
  const els = getElements();
  els.incidentList.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; color: #7f8c8d; padding: 30px 10px; font-weight: 500;">
        Інцидентів не знайдено за вказаними фільтрами
      </td>
    </tr>
  `;
}

// Рендеринг стану ERROR у таблиці
export function renderTableError(error: ApiError): void {
  const els = getElements();
  els.incidentList.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; color: #e74c3c; padding: 30px 10px; font-weight: bold;">
        Не вдалося завантажити інциденти: ${error.message} (Код: ${error.status})
      </td>
    </tr>
  `;
}

// Функція для екранування символів HTML, щоб запобігти XSS
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Рендеринг успішно отриманого списку інцидентів
export function renderIncidentsList(
  items: IncidentResponseDto[],
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
): void {
  const els = getElements();
  els.incidentList.innerHTML = "";

  items.forEach((incident) => {
    const row = document.createElement("tr");

    // Визначаємо CSS-клас для рівня загрози
    const severityClass = `severity-${incident.severity.toLowerCase()}`;

    // Форматуємо дату для користувача
    const formattedDate = new Date(incident.date).toLocaleString("uk-UA");

    row.innerHTML = `
      <td>${incident.id}</td>
      <td>${formattedDate}</td>
      <td>${incident.tag}</td>
      <td class="${severityClass}">${incident.severity}</td>
      <td>${escapeHtml(incident.reporter)}</td>
      <td>${incident.comments ? escapeHtml(incident.comments) : "-"}</td>
      <td>
        <button class="btn-edit" data-id="${incident.id}">Редагувати</button>
        <button class="btn-delete" data-id="${incident.id}">Видалити</button>
      </td>
    `;

    // Вішаємо обробники подій на кнопки через замикання
    const editBtn = row.querySelector(".btn-edit") as HTMLButtonElement;
    const deleteBtn = row.querySelector(".btn-delete") as HTMLButtonElement;

    editBtn.addEventListener("click", () => onEdit(incident.id));
    deleteBtn.addEventListener("click", () => onDelete(incident.id));

    els.incidentList.appendChild(row);
  });
}
