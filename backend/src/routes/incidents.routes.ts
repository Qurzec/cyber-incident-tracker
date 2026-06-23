import { Router } from "express";
import { IncidentRepository } from "../repositories/incident.repository";
import { IncidentService } from "../services/incident.service";
import { IncidentController } from "../controllers/incident.controller";

const router = Router();

// Ініціалізуємо шари для інцидентів
const incidentRepository = new IncidentRepository();
const incidentService = new IncidentService(incidentRepository);
const incidentController = new IncidentController(incidentService);

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

export default router;
export { incidentRepository, incidentService }; // Експортуємо про всяк випадок
