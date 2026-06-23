"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentController = void 0;
// Контролер для обробки запитів, пов'язаних з інцидентами
class IncidentController {
    incidentService;
    constructor(incidentService) {
        this.incidentService = incidentService;
    }
    // GET /api/incidents - отримати всі інциденти з фільтрами, сортуванням та пагінацією
    getAll = async (req, res, next) => {
        try {
            // Парсимо query-параметри для нашого сервісу
            const tag = req.query.tag;
            const severity = req.query.severity;
            const page = req.query.page
                ? parseInt(req.query.page, 10)
                : undefined;
            const pageSize = req.query.pageSize
                ? parseInt(req.query.pageSize, 10)
                : undefined;
            const sortBy = req.query.sortBy;
            const sortDir = req.query.sortDir;
            const result = await this.incidentService.getAllIncidents({
                tag,
                severity,
                page,
                pageSize,
                sortBy,
                sortDir,
            });
            // Повертаємо уніфіковану відповідь { items: [...], total: N }
            res.status(200).json(result);
        }
        catch (err) {
            next(err);
        }
    };
    // GET /api/incidents/:id - отримати інцидент за ID
    getById = async (req, res, next) => {
        try {
            const incidentId = req.params.id;
            const incident = await this.incidentService.getIncidentById(incidentId);
            res.status(200).json(incident);
        }
        catch (err) {
            next(err);
        }
    };
    // POST /api/incidents - створити новий інцидент
    create = async (req, res, next) => {
        try {
            const incident = await this.incidentService.createIncident(req.body);
            res.status(201).json(incident);
        }
        catch (err) {
            next(err);
        }
    };
    // PUT /api/incidents/:id - повне оновлення інциденту
    update = async (req, res, next) => {
        try {
            const incidentId = req.params.id;
            const updatedIncident = await this.incidentService.updateIncident(incidentId, req.body, false);
            res.status(200).json(updatedIncident);
        }
        catch (err) {
            next(err);
        }
    };
    // PATCH /api/incidents/:id - часткове оновлення інциденту
    patch = async (req, res, next) => {
        try {
            const incidentId = req.params.id;
            const updatedIncident = await this.incidentService.updateIncident(incidentId, req.body, true);
            res.status(200).json(updatedIncident);
        }
        catch (err) {
            next(err);
        }
    };
    // DELETE /api/incidents/:id - видалити інцидент за ID
    delete = async (req, res, next) => {
        try {
            const incidentId = req.params.id;
            await this.incidentService.deleteIncident(incidentId);
            res.status(204).end(); // 204 No Content
        }
        catch (err) {
            next(err);
        }
    };
    // GET /api/incidents/search-vulnerable - вразливий пошук через конкатенацію SQL
    searchVulnerable = async (req, res, next) => {
        try {
            const q = req.query.q || "";
            const results = await this.incidentService.searchVulnerable(q);
            res.status(200).json({
                items: results,
                total: results.length,
            });
        }
        catch (err) {
            next(err);
        }
    };
    // GET /api/incidents/:id/comments - отримати коментарі до інциденту (JOIN з Users)
    getComments = async (req, res, next) => {
        try {
            const incidentId = req.params.id;
            const comments = await this.incidentService.getComments(incidentId);
            res.status(200).json({
                items: comments,
                total: comments.length,
            });
        }
        catch (err) {
            next(err);
        }
    };
    // POST /api/incidents/:id/comments - додати новий коментар
    addComment = async (req, res, next) => {
        try {
            const incidentId = req.params.id;
            const { userId, message } = req.body;
            if (!userId) {
                return res
                    .status(400)
                    .json({ error: "Вкажіть userId для додавання коментаря" });
            }
            const comment = await this.incidentService.addComment(incidentId, userId, message);
            res.status(201).json(comment);
        }
        catch (err) {
            next(err);
        }
    };
    // GET /api/analytics/summary - отримати аналітику (агрегації COUNT, GROUP BY)
    getAnalyticsSummary = async (req, res, next) => {
        try {
            const summary = await this.incidentService.getAnalyticsSummary();
            res.status(200).json(summary);
        }
        catch (err) {
            next(err);
        }
    };
}
exports.IncidentController = IncidentController;
