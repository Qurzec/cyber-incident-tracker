const express = require('express');
const router = express.Router();
const ApiError = require('../utils/errors');

// База даних інцидентів у пам'яті
let incidents = [
    {
        id: '1717500000020',
        date: '2026-06-04T10:00',
        tag: 'DDoS-атака',
        severity: 'Високий',
        reporter: 'Служба моніторингу',
        comments: 'Атака на веб-сайт, зафіксовано велику кількість сміттєвого трафіку.',
        createdAt: Date.now() - 120000
    },
    {
        id: '1717500000021',
        date: '2026-06-04T11:15',
        tag: 'Фішинг',
        severity: 'Середній',
        reporter: 'ІТ-відділ',
        comments: 'Виявлено розсилку фішингових листів серед працівників.',
        createdAt: Date.now()
    }
];

// Мапер для DTO відповіді
function toResponseDto(incident) {
    return {
        id: incident.id,
        date: incident.date,
        tag: incident.tag,
        severity: incident.severity,
        reporter: incident.reporter,
        comments: incident.comments,
        createdAt: incident.createdAt
    };
}

// GET /api/incidents - отримати список усіх інцидентів
router.get('/', (req, res, next) => {
    try {
        const responseData = incidents.map(i => toResponseDto(i));
        res.status(200).json(responseData);
    } catch (err) {
        next(err);
    }
});

// GET /api/incidents/:id - отримати інцидент за ID
router.get('/:id', (req, res, next) => {
    try {
        const incidentId = req.params.id;
        const incident = incidents.find(i => i.id === incidentId);

        if (!incident) {
            throw new ApiError(404, 'INCIDENT_NOT_FOUND', `Інцидент з ID ${incidentId} не знайдено`);
        }

        res.status(200).json(toResponseDto(incident));
    } catch (err) {
        next(err);
    }
});

// POST /api/incidents - зареєструвати новий інцидент
router.post('/', (req, res, next) => {
    try {
        const { date, tag, severity, reporter, comments } = req.body;
        const validationErrors = [];

        // Перевірка дати
        if (!date || date.trim() === '') {
            validationErrors.push({ field: 'date', message: 'Дата та час обов\'язкові' });
        }

        // Перевірка типу інциденту
        const allowedTags = ['DDoS-атака', 'Фішинг', 'Вірусне ПЗ', 'Злам акаунту', 'Інше'];
        if (!tag || tag.trim() === '') {
            validationErrors.push({ field: 'tag', message: 'Тип інциденту є обов\'язковим' });
        } else if (!allowedTags.includes(tag.trim())) {
            validationErrors.push({ field: 'tag', message: `Дозволені типи: ${allowedTags.join(', ')}` });
        }

        // Перевірка рівня загрози
        const allowedSeverities = ['Низький', 'Середній', 'Високий', 'Критичний'];
        if (!severity || severity.trim() === '') {
            validationErrors.push({ field: 'severity', message: 'Рівень загрози є обов\'язковим' });
        } else if (!allowedSeverities.includes(severity.trim())) {
            validationErrors.push({ field: 'severity', message: `Дозволені рівні: ${allowedSeverities.join(', ')}` });
        }

        // Перевірка того, хто повідомив
        if (!reporter || reporter.trim() === '') {
            validationErrors.push({ field: 'reporter', message: 'Вкажіть, хто повідомив про подію' });
        } else if (reporter.trim().length < 3) {
            validationErrors.push({ field: 'reporter', message: 'Ім\'я репортера має містити хоча б 3 символи' });
        } else if (reporter.trim().length > 50) {
            validationErrors.push({ field: 'reporter', message: 'Ім\'я репортера занадто довге (максимум 50 символів)' });
        }

        // Перевірка деталей (якщо вказані)
        if (comments && comments.trim() !== '' && comments.trim().length < 5) {
            validationErrors.push({ field: 'comments', message: 'Опис інциденту має містити хоча б 5 символів' });
        }

        if (validationErrors.length > 0) {
            throw new ApiError(400, 'VALIDATION_ERROR', 'Помилка валідації полів інциденту', validationErrors);
        }

        const newIncident = {
            id: Date.now().toString(),
            date: date.trim(),
            tag: tag.trim(),
            severity: severity.trim(),
            reporter: reporter.trim(),
            comments: (comments || '').trim(),
            createdAt: Date.now()
        };

        incidents.push(newIncident);
        res.status(201).json(toResponseDto(newIncident));
    } catch (err) {
        next(err);
    }
});

// PUT /api/incidents/:id - оновити дані інциденту
router.put('/:id', (req, res, next) => {
    try {
        const incidentId = req.params.id;
        const incidentIndex = incidents.findIndex(i => i.id === incidentId);

        if (incidentIndex === -1) {
            throw new ApiError(404, 'INCIDENT_NOT_FOUND', `Інцидент з ID ${incidentId} не знайдено для оновлення`);
        }

        const { date, tag, severity, reporter, comments } = req.body;
        const validationErrors = [];

        if (!date || date.trim() === '') {
            validationErrors.push({ field: 'date', message: 'Дата та час обов\'язкові' });
        }

        const allowedTags = ['DDoS-атака', 'Фішинг', 'Вірусне ПЗ', 'Злам акаунту', 'Інше'];
        if (!tag || tag.trim() === '') {
            validationErrors.push({ field: 'tag', message: 'Тип інциденту є обов\'язковим' });
        } else if (!allowedTags.includes(tag.trim())) {
            validationErrors.push({ field: 'tag', message: `Дозволені типи: ${allowedTags.join(', ')}` });
        }

        const allowedSeverities = ['Низький', 'Середній', 'Високий', 'Критичний'];
        if (!severity || severity.trim() === '') {
            validationErrors.push({ field: 'severity', message: 'Рівень загрози є обов\'язковим' });
        } else if (!allowedSeverities.includes(severity.trim())) {
            validationErrors.push({ field: 'severity', message: `Дозволені рівні: ${allowedSeverities.join(', ')}` });
        }

        if (!reporter || reporter.trim() === '') {
            validationErrors.push({ field: 'reporter', message: 'Вкажіть, хто повідомив про подію' });
        } else if (reporter.trim().length < 3) {
            validationErrors.push({ field: 'reporter', message: 'Ім\'я репортера має містити хоча б 3 символи' });
        } else if (reporter.trim().length > 50) {
            validationErrors.push({ field: 'reporter', message: 'Ім\'я репортера занадто довге (максимум 50 символів)' });
        }

        if (comments && comments.trim() !== '' && comments.trim().length < 5) {
            validationErrors.push({ field: 'comments', message: 'Опис інциденту має містити хоча б 5 символів' });
        }

        if (validationErrors.length > 0) {
            throw new ApiError(400, 'VALIDATION_ERROR', 'Помилка валідації при оновленні інциденту', validationErrors);
        }

        incidents[incidentIndex] = {
            id: incidentId,
            date: date.trim(),
            tag: tag.trim(),
            severity: severity.trim(),
            reporter: reporter.trim(),
            comments: (comments || '').trim(),
            createdAt: incidents[incidentIndex].createdAt
        };

        res.status(200).json(toResponseDto(incidents[incidentIndex]));
    } catch (err) {
        next(err);
    }
});

// DELETE /api/incidents/:id - видалити інцидент за ID
router.delete('/:id', (req, res, next) => {
    try {
        const incidentId = req.params.id;
        const incidentIndex = incidents.findIndex(i => i.id === incidentId);

        if (incidentIndex === -1) {
            throw new ApiError(404, 'INCIDENT_NOT_FOUND', `Інцидент з ID ${incidentId} не знайдено для видалення`);
        }

        incidents.splice(incidentIndex, 1);
        res.status(204).end();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
