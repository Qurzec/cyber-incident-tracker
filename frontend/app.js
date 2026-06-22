// 1. Оголошення стану (дані нашого додатка)
let incidents = []; // Масив для збереження інцидентів
let editingId = null; // ID інциденту, який ми зараз редагуємо (null, якщо додаємо новий)

// 2. Отримання посилань на елементи DOM
const incidentForm = document.getElementById("incidentForm");
const incidentList = document.getElementById("incidentList");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("formTitle");
const formSection = document.getElementById("formSection");

// Посилання на поля форми
const incidentDateInput = document.getElementById("incidentDate");
const incidentTagSelect = document.getElementById("incidentTag");
const incidentSeveritySelect = document.getElementById("incidentSeverity");
const incidentReporterInput = document.getElementById("incidentReporter");
const incidentCommentsTextarea = document.getElementById("incidentComments");

// Посилання на елементи панелі фільтрації
const searchReporterInput = document.getElementById("searchReporter");
const filterTagSelect = document.getElementById("filterTag");
const sortDateSelect = document.getElementById("sortDate");

// Ключ для збереження в LocalStorage
const STORAGE_KEY = "lr1_incidents";

// 3. Функції для роботи з LocalStorage
function saveToStorage() {
  // Перетворюємо масив об'єктів у рядок JSON та зберігаємо
  localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
}

function loadFromStorage() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (json === null) {
    return []; // Якщо нічого немає, повертаємо порожній масив
  }
  try {
    // Пробуємо розпарсити дані
    const data = JSON.parse(json);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Помилка завантаження даних з LocalStorage", e);
    return []; // У разі помилки повертаємо порожній масив
  }
}

// 4. Функції валідації форми
function showError(inputId, errorId, message) {
  // Додаємо червону рамку полю
  document.getElementById(inputId).classList.add("invalid");
  // Пишемо текст помилки
  document.getElementById(errorId).textContent = message;
}

function clearError(inputId, errorId) {
  // Прибираємо червону рамку
  document.getElementById(inputId).classList.remove("invalid");
  // Очищаємо текст помилки
  document.getElementById(errorId).textContent = "";
}

function clearErrors() {
  // Очищаємо помилки для всіх полів
  clearError("incidentDate", "dateError");
  clearError("incidentTag", "tagError");
  clearError("incidentSeverity", "severityError");
  clearError("incidentReporter", "reporterError");
  clearError("incidentComments", "commentsError");
}

function readForm() {
  // Зчитуємо дані з полів у простий об'єкт (DTO)
  return {
    date: incidentDateInput.value,
    tag: incidentTagSelect.value,
    severity: incidentSeveritySelect.value,
    reporter: incidentReporterInput.value.trim(),
    comments: incidentCommentsTextarea.value.trim(),
  };
}

function validate(dto) {
  clearErrors(); // Спочатку очищаємо старі помилки
  let isValid = true;

  // Перевірка дати
  if (dto.date === "") {
    showError("incidentDate", "dateError", "Оберіть дату та час інциденту.");
    isValid = false;
  }

  // Перевірка типу інциденту
  if (dto.tag === "") {
    showError("incidentTag", "tagError", "Оберіть тип інциденту.");
    isValid = false;
  }

  // Перевірка рівня загрози
  if (dto.severity === "") {
    showError("incidentSeverity", "severityError", "Оберіть рівень загрози.");
    isValid = false;
  }

  // Перевірка імені репортера
  if (dto.reporter === "") {
    showError(
      "incidentReporter",
      "reporterError",
      "Ім'я репортера є обов'язковим.",
    );
    isValid = false;
  } else if (dto.reporter.length < 3) {
    showError(
      "incidentReporter",
      "reporterError",
      "Ім'я повинно містити щонайменше 3 символи.",
    );
    isValid = false;
  } else if (dto.reporter.length > 50) {
    showError(
      "incidentReporter",
      "reporterError",
      "Ім'я не повинно перевищувати 50 символів.",
    );
    isValid = false;
  }

  // Перевірка коментарів (не обов'язкові, але якщо є, то мінімум 5 символів)
  if (dto.comments !== "" && dto.comments.length < 5) {
    showError(
      "incidentComments",
      "commentsError",
      "Коментар має бути довжиною від 5 символів.",
    );
    isValid = false;
  }

  return isValid;
}

// 5. Функція для відображення (рендеру) списку інцидентів
function renderIncidents() {
  // Очищуємо таблицю перед малюванням
  incidentList.innerHTML = "";

  // Отримуємо значення фільтрів та пошуку
  const searchQuery = searchReporterInput.value.toLowerCase().trim();
  const filterTag = filterTagSelect.value;
  const sortOrder = sortDateSelect.value;

  // Фільтруємо масив інцидентів
  let filteredIncidents = incidents.filter(function (incident) {
    // Пошук за ім'ям репортера (регістронезалежний)
    const matchesSearch = incident.reporter.toLowerCase().includes(searchQuery);
    // Фільтр за типом (тегом) інциденту
    const matchesTag = filterTag === "" || incident.tag === filterTag;

    return matchesSearch && matchesTag;
  });

  // Сортуємо відфільтровані інциденти за датою
  filteredIncidents.sort(function (a, b) {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    if (sortOrder === "newest") {
      return dateB - dateA; // Новіші спочатку
    } else {
      return dateA - dateB; // Старіші спочатку
    }
  });

  // Якщо інцидентів немає, виводимо відповідне повідомлення
  if (filteredIncidents.length === 0) {
    incidentList.innerHTML =
      '<tr><td colspan="7" style="text-align: center;">Інцидентів не знайдено за вказаними фільтрами</td></tr>';
    return;
  }

  // Проходимо по кожному відфільтрованому інциденту
  filteredIncidents.forEach(function (incident) {
    const row = document.createElement("tr");

    // Визначаємо клас для кольору в залежності від рівня загрози
    const severityClass = "severity-" + incident.severity.toLowerCase();

    // Форматуємо дату для гарного відображення
    const formattedDate = new Date(incident.date).toLocaleString("uk-UA");

    // Рендеримо рядок таблиці (використовуємо data-id для кнопок для делегування подій)
    row.innerHTML = `
            <td>${incident.id}</td>
            <td>${formattedDate}</td>
            <td>${incident.tag}</td>
            <td class="${severityClass}">${incident.severity}</td>
            <td>${incident.reporter}</td>
            <td>${incident.comments || "-"}</td>
            <td>
                <button class="btn-edit" data-id="${incident.id}">Редагувати</button>
                <button class="btn-delete" data-id="${incident.id}">Видалити</button>
            </td>
        `;

    incidentList.appendChild(row);
  });
}

// 6. Допоміжні функції для роботи зі станом (додавання та оновлення)
function addItem(dto) {
  const newIncident = {
    id: Date.now(), // Унікальний стабільний ID (мітка часу)
    date: dto.date,
    tag: dto.tag,
    severity: dto.severity,
    reporter: dto.reporter,
    comments: dto.comments,
  };
  incidents.push(newIncident);
}

function updateItem(id, dto) {
  const incidentIndex = incidents.findIndex(function (item) {
    return item.id === id;
  });

  if (incidentIndex !== -1) {
    incidents[incidentIndex].date = dto.date;
    incidents[incidentIndex].tag = dto.tag;
    incidents[incidentIndex].severity = dto.severity;
    incidents[incidentIndex].reporter = dto.reporter;
    incidents[incidentIndex].comments = dto.comments;
  }
}

// 7. Обробка події відправки форми (Додавання або Збереження змін)
incidentForm.addEventListener("submit", function (event) {
  // Зупиняємо перезавантаження сторінки
  event.preventDefault();

  // Збираємо дані
  const dto = readForm();

  // Робимо валідацію
  if (!validate(dto)) {
    return; // Якщо дані некоректні - зупиняємо процес
  }

  // Блокуємо кнопку, щоб уникнути подвійного відправлення
  submitBtn.disabled = true;

  if (editingId === null) {
    // Додаємо новий запис через окрему функцію
    addItem(dto);
  } else {
    // Оновлюємо існуючий запис через окрему функцію
    updateItem(editingId, dto);

    // Повертаємо форму до звичайного стану
    resetEditingState();
  }

  // Зберігаємо зміни у локальне сховище
  saveToStorage();

  // Оновлюємо таблицю
  renderIncidents();

  // Очищаємо форму
  incidentForm.reset();

  // Повертаємо фокус на дату для зручності
  incidentDateInput.focus();

  // Розблокуємо кнопку при відправленні
  setTimeout(function () {
    submitBtn.disabled = false;
  }, 300);
});

// 8. Функція переведення форми в режим редагування
function startEditing(id) {
  const incident = incidents.find(function (item) {
    return item.id === id;
  });

  if (!incident) return;

  // Встановлюємо ID редагованого інциденту
  editingId = id;

  // Заповнюємо форму значеннями інциденту
  incidentDateInput.value = incident.date;
  incidentTagSelect.value = incident.tag;
  incidentSeveritySelect.value = incident.severity;
  incidentReporterInput.value = incident.reporter;
  incidentCommentsTextarea.value = incident.comments;

  // Змінюємо вигляд форми для UX
  formTitle.textContent = "Редагувати інцидент";
  submitBtn.textContent = "Зберегти зміни";
  cancelEditBtn.style.display = "inline-block";
  formSection.classList.add("editing-mode");

  // Очищуємо старі помилки, щоб не збивати користувача
  clearErrors();

  // Фокусуємося на першому полі
  incidentDateInput.focus();
}

// 9. Функція скасування режиму редагування
function resetEditingState() {
  editingId = null;
  formTitle.textContent = "Додати новий інцидент";
  submitBtn.textContent = "Додати інцидент";
  cancelEditBtn.style.display = "none";
  formSection.classList.remove("editing-mode");
  incidentForm.reset();
  clearErrors();
}

// Обробник натискання кнопки "Скасувати редагування"
cancelEditBtn.addEventListener("click", function () {
  resetEditingState();
});

// 10. Делегування подій на таблиці (динамічні кнопки Видалити/Редагувати)
incidentList.addEventListener("click", function (event) {
  const target = event.target;

  // Отримуємо ID з data-атрибута кнопки
  const id = Number(target.dataset.id);
  if (!id) return;

  // Якщо клікнули на "Видалити"
  if (target.classList.contains("btn-delete")) {
    // Питаємо підтвердження для безпеки
    if (confirm("Ви впевнені, що хочете видалити цей інцидент?")) {
      // Фільтруємо масив
      incidents = incidents.filter(function (item) {
        return item.id !== id;
      });

      // Якщо ми видалили той інцидент, який зараз редагуємо - скасовуємо редагування
      if (editingId === id) {
        resetEditingState();
      }

      saveToStorage();
      renderIncidents();
    }
  }

  // Якщо клікнули на "Редагувати"
  if (target.classList.contains("btn-edit")) {
    startEditing(id);
  }
});

// 11. Обробники подій для пошуку, фільтрації та сортування
searchReporterInput.addEventListener("input", renderIncidents);
filterTagSelect.addEventListener("change", renderIncidents);
sortDateSelect.addEventListener("change", renderIncidents);

// 12. Ініціалізація додатку при запуску
incidents = loadFromStorage();
renderIncidents();
