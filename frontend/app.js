// 1. Оголошення стану (дані нашого додатка)
let incidents = [];

// 2. Отримання посилань на елементи DOM
const incidentForm = document.getElementById('incidentForm');
const incidentList = document.getElementById('incidentList');
const submitBtn = document.getElementById('submitBtn');

// 3. Функція для відображення (рендеру) списку інцидентів
function renderIncidents() {
    // Очищуємо таблицю перед малюванням
    incidentList.innerHTML = '';

    // Якщо інцидентів немає, можна вивести повідомлення (опціонально)
    if (incidents.length === 0) {
        incidentList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Інцидентів поки що немає</td></tr>';
        return;
    }

    // Проходимо по кожному інциденту в масиві
    incidents.forEach(function(incident) {
        const row = document.createElement('tr');
        
        // Визначаємо клас для кольору в залежності від рівня загрози
        const severityClass = 'severity-' + incident.severity.toLowerCase();

        row.innerHTML = `
            <td>${incident.id}</td>
            <td>${new Date(incident.date).toLocaleString('uk-UA')}</td>
            <td>${incident.tag}</td>
            <td class="${severityClass}">${incident.severity}</td>
            <td>${incident.reporter}</td>
            <td>${incident.comments}</td>
            <td>
                <button class="btn-delete" onclick="deleteIncident(${incident.id})">Видалити</button>
            </td>
        `;
        
        incidentList.appendChild(row);
    });
}

// 4. Обробка події відправки форми (Додавання)
incidentForm.addEventListener('submit', function(event) {
    // Зупиняємо стандартну поведінку (перезавантаження сторінки)
    event.preventDefault();

    // Блокуємо кнопку, щоб уникнути подвійного натискання (базовий UX)
    submitBtn.disabled = true;

    // Збираємо дані з полів форми
    const newIncident = {
        id: Date.now(), // Стабільний унікальний ідентифікатор
        date: document.getElementById('incidentDate').value,
        tag: document.getElementById('incidentTag').value,
        severity: document.getElementById('incidentSeverity').value,
        reporter: document.getElementById('incidentReporter').value,
        comments: document.getElementById('incidentComments').value
    };

    // Додаємо новий інцидент у наш "стан"
    incidents.push(newIncident);

    // Оновлюємо таблицю
    renderIncidents();

    // Очищаємо форму (UX)
    incidentForm.reset();
    
    // Повертаємо фокус на поле дати для зручності (UX)
    document.getElementById('incidentDate').focus();

    // Розблокуємо кнопку через невелику затримку або одразу
    setTimeout(function() {
        submitBtn.disabled = false;
    }, 500);
});

// 5. Функція видалення інциденту
function deleteIncident(id) {
    // Фільтруємо масив: залишаємо всі інциденти, крім того, що має цей id
    incidents = incidents.filter(function(incident) {
        return incident.id !== id;
    });

    // Перемальовуємо таблицю
    renderIncidents();
}

// Початковий рендер (на випадок, якщо в масиві вже щось є)
renderIncidents();
