import { Request, Response, NextFunction } from "express";
import { IncidentService } from "../services/incident.service";

// Контролер для обробки запитів, пов'язаних з інцидентами
export class IncidentController {
  private incidentService: IncidentService;

  constructor(incidentService: IncidentService) {
    this.incidentService = incidentService;
  }

  // GET /api/incidents - отримати всі інциденти з фільтрами, сортуванням та пагінацією
  public getAll = (req: Request, res: Response, next: NextFunction) => {
    try {
      // Парсимо query-параметри для нашого сервісу
      const tag = req.query.tag as string | undefined;
      const severity = req.query.severity as string | undefined;

      const page = req.query.page
        ? parseInt(req.query.page as string, 10)
        : undefined;
      const pageSize = req.query.pageSize
        ? parseInt(req.query.pageSize as string, 10)
        : undefined;

      const sortBy = req.query.sortBy as string | undefined;
      const sortDir = req.query.sortDir as "asc" | "desc" | undefined;

      const result = this.incidentService.getAllIncidents({
        tag,
        severity,
        page,
        pageSize,
        sortBy,
        sortDir,
      });

      // Повертаємо уніфіковану відповідь { items: [...], total: N }
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  // GET /api/incidents/:id - отримати інцидент за ID
  public getById = (req: Request, res: Response, next: NextFunction) => {
    try {
      const incidentId = req.params.id as string;
      const incident = this.incidentService.getIncidentById(incidentId);
      res.status(200).json(incident);
    } catch (err) {
      next(err);
    }
  };

  // POST /api/incidents - створити новий інцидент
  public create = (req: Request, res: Response, next: NextFunction) => {
    try {
      const incident = this.incidentService.createIncident(req.body);
      res.status(201).json(incident);
    } catch (err) {
      next(err);
    }
  };

  // PUT /api/incidents/:id - повне оновлення інциденту
  public update = (req: Request, res: Response, next: NextFunction) => {
    try {
      const incidentId = req.params.id as string;
      const updatedIncident = this.incidentService.updateIncident(
        incidentId,
        req.body,
        false
      );
      res.status(200).json(updatedIncident);
    } catch (err) {
      next(err);
    }
  };

  // PATCH /api/incidents/:id - часткове оновлення інциденту
  public patch = (req: Request, res: Response, next: NextFunction) => {
    try {
      const incidentId = req.params.id as string;
      const updatedIncident = this.incidentService.updateIncident(
        incidentId,
        req.body,
        true
      );
      res.status(200).json(updatedIncident);
    } catch (err) {
      next(err);
    }
  };

  // DELETE /api/incidents/:id - видалити інцидент за ID
  public delete = (req: Request, res: Response, next: NextFunction) => {
    try {
      const incidentId = req.params.id as string;
      this.incidentService.deleteIncident(incidentId);
      res.status(204).end(); // 204 No Content
    } catch (err) {
      next(err);
    }
  };
}
