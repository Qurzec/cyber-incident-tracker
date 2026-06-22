import { Router } from "express";
import { IncidentRepository } from "../repositories/incident.repository";
import { IncidentService } from "../services/incident.service";
import { IncidentController } from "../controllers/incident.controller";

const router = Router();

// Ініціалізуємо шари для інцидентів
const incidentRepository = new IncidentRepository();
const incidentService = new IncidentService(incidentRepository);
const incidentController = new IncidentController(incidentService);

// Маршрути для /api/incidents
router.get("/", incidentController.getAll);
router.get("/:id", incidentController.getById);
router.post("/", incidentController.create);
router.put("/:id", incidentController.update);
router.patch("/:id", incidentController.patch);
router.delete("/:id", incidentController.delete);

export default router;
export { incidentRepository, incidentService }; // Експортуємо про всяк випадок
