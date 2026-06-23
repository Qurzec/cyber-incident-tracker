"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incidentService = exports.incidentRepository = void 0;
const express_1 = require("express");
const incident_repository_1 = require("../repositories/incident.repository");
const incident_service_1 = require("../services/incident.service");
const incident_controller_1 = require("../controllers/incident.controller");
const router = (0, express_1.Router)();
// Ініціалізуємо шари для інцидентів
const incidentRepository = new incident_repository_1.IncidentRepository();
exports.incidentRepository = incidentRepository;
const incidentService = new incident_service_1.IncidentService(incidentRepository);
exports.incidentService = incidentService;
const incidentController = new incident_controller_1.IncidentController(incidentService);
// Спеціальні маршрути (мають бути оголошені перед /:id, щоб уникнути конфліктів парсингу шляхів)
router.get("/search-vulnerable", incidentController.searchVulnerable);
router.get("/analytics/summary", incidentController.getAnalyticsSummary);
// Маршрути для коментарів до інцидентів (JOIN сутностей)
router.get("/:id/comments", incidentController.getComments);
router.post("/:id/comments", incidentController.addComment);
// Стандартні CRUD маршрути для /api/incidents
router.get("/", incidentController.getAll);
router.get("/:id", incidentController.getById);
router.post("/", incidentController.create);
router.put("/:id", incidentController.update);
router.patch("/:id", incidentController.patch);
router.delete("/:id", incidentController.delete);
exports.default = router;
