import * as apiClient from "./apiClient.js";
import * as ui from "./ui.js";
// Локальний стан нашого фронтенд-додатка
let incidents = [];
let editingId = null;
// Функція завантаження інцидентів з сервера з обробкою всіх станів (Рівень "На Відмінно")
async function loadIncidents() {
    const els = ui.getElements();
    ui.renderLoading();
    ui.renderGlobalError(null); // Очищуємо попередні помилки з'єднання
    // Отримуємо поточні значення фільтрів з UI
    const filterTag = els.filterTag.value;
    const filterSeverity = els.incidentSeverity ? document.getElementById("filterSeverity")?.value || "" : "";
    const sortOrder = els.sortDate.value; // "newest" або "oldest"
    try {
        // Робимо асинхронний запит до нашого apiClient
        const data = await apiClient.getIncidents({
            tag: filterTag || undefined,
            severity: filterSeverity || undefined,
            sortBy: "date",
            sortDir: sortOrder === "newest" ? "desc" : "asc",
        });
        incidents = data.items;
        // Фільтрація репортера на клієнті (якщо вказано)
        const searchVal = els.searchReporter.value.toLowerCase().trim();
        let displayItems = incidents;
        if (searchVal) {
            displayItems = displayItems.filter((item) => item.reporter.toLowerCase().includes(searchVal));
        }
        if (displayItems.length === 0) {
            ui.renderEmpty();
        }
        else {
            ui.renderIncidentsList(displayItems, startEditing, confirmAndDelete);
        }
    }
    catch (err) {
        // Малюємо стан помилки у таблиці та виводимо банер зверху
        ui.renderTableError(err);
        ui.renderGlobalError(err);
    }
}
// Початок редагування інциденту
function startEditing(id) {
    const incident = incidents.find((item) => item.id.toString() === id.toString());
    if (!incident)
        return;
    editingId = id;
    const els = ui.getElements();
    els.incidentDate.value = incident.date;
    els.incidentTag.value = incident.tag;
    els.incidentSeverity.value = incident.severity;
    els.incidentReporter.value = incident.reporter;
    els.incidentComments.value = incident.comments || "";
    els.formTitle.textContent = "Редагувати інцидент";
    els.submitBtn.textContent = "Зберегти зміни";
    els.cancelEditBtn.style.display = "inline-block";
    els.formSection.classList.add("editing-mode");
    ui.clearErrors();
    els.incidentDate.focus();
}
// Скасування режиму редагування
function resetEditingState() {
    editingId = null;
    const els = ui.getElements();
    els.formTitle.textContent = "Додати новий інцидент";
    els.submitBtn.textContent = "Додати інцидент";
    els.cancelEditBtn.style.display = "none";
    els.formSection.classList.remove("editing-mode");
    els.incidentForm.reset();
    ui.clearErrors();
}
// Запит на підтвердження та видалення інциденту з блокуванням кнопок (Рівень "На Добре/Відмінно")
async function confirmAndDelete(id) {
    if (confirm("Ви впевнені, що хочете видалити цей інцидент?")) {
        ui.setFormEnabled(false);
        try {
            await apiClient.deleteIncident(id);
            ui.showNotice("Інцидент успішно видалено");
        }
        catch (err) {
            ui.showNotice(`Помилка видалення: ${err.message}`, true);
        }
        finally {
            ui.setFormEnabled(true);
            await loadIncidents();
        }
    }
}
// Локальна валідація форми перед відправкою на сервер
function validateForm(dto) {
    ui.clearErrors();
    let isValid = true;
    if (!dto.date) {
        ui.showError("incidentDate", "dateError", "Оберіть дату та час інциденту.");
        isValid = false;
    }
    if (!dto.tag) {
        ui.showError("incidentTag", "tagError", "Оберіть тип інциденту.");
        isValid = false;
    }
    if (!dto.severity) {
        ui.showError("incidentSeverity", "severityError", "Оберіть рівень загрози.");
        isValid = false;
    }
    if (!dto.reporter) {
        ui.showError("incidentReporter", "reporterError", "Ім'я репортера є обов'язковим.");
        isValid = false;
    }
    else if (dto.reporter.length < 3) {
        ui.showError("incidentReporter", "reporterError", "Ім'я повинно містити від 3 символів.");
        isValid = false;
    }
    else if (dto.reporter.length > 50) {
        ui.showError("incidentReporter", "reporterError", "Ім'я повинно бути до 50 символів.");
        isValid = false;
    }
    if (dto.comments && dto.comments.length > 0 && dto.comments.length < 5) {
        ui.showError("incidentComments", "commentsError", "Коментар має бути довжиною від 5 символів.");
        isValid = false;
    }
    return isValid;
}
// Обробник подачі форми (додавання або редагування)
async function handleFormSubmit(event) {
    event.preventDefault();
    const els = ui.getElements();
    const dto = {
        date: els.incidentDate.value,
        tag: els.incidentTag.value,
        severity: els.incidentSeverity.value,
        reporter: els.incidentReporter.value.trim(),
        comments: els.incidentComments.value.trim() || undefined,
    };
    if (!validateForm(dto)) {
        return;
    }
    // Блокуємо форму під час асинхронного запиту до API
    ui.setFormEnabled(false);
    try {
        if (editingId === null) {
            await apiClient.createIncident(dto);
            ui.showNotice("Інцидент успішно зареєстровано");
        }
        else {
            await apiClient.updateIncident(editingId, dto);
            ui.showNotice("Інцидент успішно оновлено");
            resetEditingState();
        }
        els.incidentForm.reset();
    }
    catch (err) {
        ui.showNotice(`Не вдалося зберегти запис: ${err.message}`, true);
    }
    finally {
        // Розблоковуємо форму у будь-якому випадку
        ui.setFormEnabled(true);
        await loadIncidents();
    }
}
// Ініціалізація додатку при завантаженні сторінки
document.addEventListener("DOMContentLoaded", () => {
    const els = ui.getElements();
    // Налаштування селектора користувача для демонстрації IDOR
    if (!localStorage.getItem("demoUserId")) {
        localStorage.setItem("demoUserId", "1");
    }
    const demoUserSelect = document.getElementById("demoUserSelect");
    if (demoUserSelect) {
        demoUserSelect.value = localStorage.getItem("demoUserId") || "1";
        demoUserSelect.addEventListener("change", () => {
            localStorage.setItem("demoUserId", demoUserSelect.value);
            ui.showNotice(`Активовано користувача з ID: ${demoUserSelect.value}`);
            resetEditingState();
            loadIncidents();
        });
    }
    // Реєструємо слухачі подій для форми
    els.incidentForm.addEventListener("submit", handleFormSubmit);
    els.cancelEditBtn.addEventListener("click", resetEditingState);
    // Реєструємо слухачі подій для панелі фільтрації
    els.searchReporter.addEventListener("input", loadIncidents);
    els.filterTag.addEventListener("change", loadIncidents);
    els.sortDate.addEventListener("change", loadIncidents);
    // Кнопка примусового скасування поточного API-запиту
    if (els.abortBtn) {
        els.abortBtn.addEventListener("click", () => {
            apiClient.cancelActiveRequest();
            ui.showNotice("З'єднання перервано користувачем", true);
            ui.setFormEnabled(true);
            ui.renderGlobalError({
                status: 0,
                message: "Перервано",
                details: "Запит було скасовано користувачем вручну через натискання кнопки скасування."
            });
        });
    }
    // Завантажуємо перші дані
    loadIncidents();
});
