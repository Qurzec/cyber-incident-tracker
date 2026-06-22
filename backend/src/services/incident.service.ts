import { IncidentRepository } from "../repositories/incident.repository";
import {
  CreateIncidentRequestDto,
  UpdateIncidentRequestDto,
  Incident,
  IncidentResponseDto,
} from "../dtos/incident.dto";
import { ApiError } from "../utils/errors";

// Сервіс для бізнес-логіки інцидентів
export class IncidentService {
  private incidentRepository: IncidentRepository;

  constructor(incidentRepository: IncidentRepository) {
    this.incidentRepository = incidentRepository;
  }

  // Перетворити модель інциденту в DTO відповіді
  private toResponseDto(incident: Incident): IncidentResponseDto {
    return {
      id: incident.id,
      date: incident.date,
      tag: incident.tag,
      severity: incident.severity,
      reporter: incident.reporter,
      comments: incident.comments,
      createdAt: incident.createdAt,
    };
  }

  // Отримати список інцидентів з підтримкою фільтрації, сортування та пагінації (Excellent requirements)
  public getAllIncidents(query: {
    tag?: string;
    severity?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
  }): { items: IncidentResponseDto[]; total: number } {
    let list = this.incidentRepository.findAll();

    // 1. Фільтрація
    if (query.tag) {
      const searchTag = query.tag.trim().toLowerCase();
      list = list.filter((i) => i.tag.toLowerCase().includes(searchTag));
    }
    if (query.severity) {
      const searchSeverity = query.severity.trim().toLowerCase();
      list = list.filter((i) => i.severity.toLowerCase() === searchSeverity);
    }

    // 2. Сортування
    if (query.sortBy) {
      const field = query.sortBy;
      const direction = query.sortDir === "desc" ? "desc" : "asc";

      list.sort((a, b) => {
        const valA = a[field as keyof Incident];
        const valB = b[field as keyof Incident];

        if (valA === undefined || valB === undefined) return 0;

        if (typeof valA === "string" && typeof valB === "string") {
          return direction === "desc"
            ? valB.localeCompare(valA, "uk-UA")
            : valA.localeCompare(valB, "uk-UA");
        } else if (typeof valA === "number" && typeof valB === "number") {
          return direction === "desc" ? valB - valA : valA - valB;
        }
        return 0;
      });
    } else {
      // За замовчуванням сортуємо за createdAt (новіші спочатку)
      list.sort((a, b) => b.createdAt - a.createdAt);
    }

    const totalCount = list.length;

    // 3. Пагінація
    if (query.page && query.pageSize) {
      const page = Math.max(1, query.page);
      const pageSize = Math.max(1, query.pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      list = list.slice(start, end);
    }

    return {
      items: list.map((i) => this.toResponseDto(i)),
      total: totalCount,
    };
  }

  // Отримати один інцидент за ID
  public getIncidentById(id: string): IncidentResponseDto {
    const incident = this.incidentRepository.findById(id);
    if (!incident) {
      throw new ApiError(
        404,
        "INCIDENT_NOT_FOUND",
        `Інцидент з ID ${id} не знайдено`
      );
    }
    return this.toResponseDto(incident);
  }

  // Зареєструвати новий інцидент
  public createIncident(dto: CreateIncidentRequestDto): IncidentResponseDto {
    const validationErrors: { field: string; message: string }[] = [];

    // Перевірка дати
    if (!dto.date || dto.date.trim() === "") {
      validationErrors.push({
        field: "date",
        message: "Дата та час обов'язкові",
      });
    }

    // Перевірка типу інциденту (тегу)
    const allowedTags = [
      "DDoS",
      "Фішинг",
      "Вредоносне ПО",
      "Несанкціонований доступ",
      "Інше",
    ];
    if (!dto.tag || dto.tag.trim() === "") {
      validationErrors.push({
        field: "tag",
        message: "Тип інциденту є обов'язковим",
      });
    } else if (!allowedTags.includes(dto.tag.trim())) {
      validationErrors.push({
        field: "tag",
        message: `Дозволені типи: ${allowedTags.join(", ")}`,
      });
    }

    // Перевірка рівня загрози
    const allowedSeverities = ["Низький", "Середній", "Високий", "Критичний"];
    if (!dto.severity || dto.severity.trim() === "") {
      validationErrors.push({
        field: "severity",
        message: "Рівень загрози є обов'язковим",
      });
    } else if (!allowedSeverities.includes(dto.severity.trim())) {
      validationErrors.push({
        field: "severity",
        message: `Дозволені рівні: ${allowedSeverities.join(", ")}`,
      });
    }

    // Перевірка репортера
    if (!dto.reporter || dto.reporter.trim() === "") {
      validationErrors.push({
        field: "reporter",
        message: "Вкажіть, хто повідомив про подію",
      });
    } else if (dto.reporter.trim().length < 3) {
      validationErrors.push({
        field: "reporter",
        message: "Ім'я репортера має містити хоча б 3 символи",
      });
    } else if (dto.reporter.trim().length > 50) {
      validationErrors.push({
        field: "reporter",
        message: "Ім'я репортера занадто довге (максимум 50 символів)",
      });
    }

    // Перевірка коментарів
    if (
      dto.comments &&
      dto.comments.trim() !== "" &&
      dto.comments.trim().length < 5
    ) {
      validationErrors.push({
        field: "comments",
        message: "Опис інциденту має містити хоча б 5 символів",
      });
    }

    if (validationErrors.length > 0) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Помилка валідації полів інциденту",
        validationErrors
      );
    }

    const newIncident: Incident = {
      id: Date.now().toString(),
      date: dto.date.trim(),
      tag: dto.tag.trim(),
      severity: dto.severity.trim(),
      reporter: dto.reporter.trim(),
      comments: (dto.comments || "").trim(),
      createdAt: Date.now(),
    };

    const savedIncident = this.incidentRepository.create(newIncident);
    return this.toResponseDto(savedIncident);
  }

  // Оновити дані інциденту за ID (повне або часткове оновлення)
  public updateIncident(
    id: string,
    dto: UpdateIncidentRequestDto,
    isPartial = false
  ): IncidentResponseDto {
    const existingIncident = this.incidentRepository.findById(id);
    if (!existingIncident) {
      throw new ApiError(
        404,
        "INCIDENT_NOT_FOUND",
        `Інцидент з ID ${id} не знайдено для оновлення`
      );
    }

    const validationErrors: { field: string; message: string }[] = [];

    // Перевірка дати
    if (!isPartial || dto.date !== undefined) {
      if (!dto.date || dto.date.trim() === "") {
        validationErrors.push({
          field: "date",
          message: "Дата та час обов'язкові",
        });
      }
    }

    // Перевірка типу
    if (!isPartial || dto.tag !== undefined) {
      const allowedTags = [
        "DDoS",
        "Фішинг",
        "Вредоносне ПО",
        "Несанкціонований доступ",
        "Інше",
      ];
      if (!dto.tag || dto.tag.trim() === "") {
        validationErrors.push({
          field: "tag",
          message: "Тип інциденту є обов'язковим",
        });
      } else if (!allowedTags.includes(dto.tag.trim())) {
        validationErrors.push({
          field: "tag",
          message: `Дозволені типи: ${allowedTags.join(", ")}`,
        });
      }
    }

    // Перевірка рівня загрози
    if (!isPartial || dto.severity !== undefined) {
      const allowedSeverities = ["Низький", "Середній", "Високий", "Критичний"];
      if (!dto.severity || dto.severity.trim() === "") {
        validationErrors.push({
          field: "severity",
          message: "Рівень загрози є обов'язковим",
        });
      } else if (!allowedSeverities.includes(dto.severity.trim())) {
        validationErrors.push({
          field: "severity",
          message: `Дозволені рівні: ${allowedSeverities.join(", ")}`,
        });
      }
    }

    // Перевірка репортера
    if (!isPartial || dto.reporter !== undefined) {
      if (!dto.reporter || dto.reporter.trim() === "") {
        validationErrors.push({
          field: "reporter",
          message: "Вкажіть, хто повідомив про подію",
        });
      } else if (dto.reporter.trim().length < 3) {
        validationErrors.push({
          field: "reporter",
          message: "Ім'я репортера має містити хоча б 3 символи",
        });
      } else if (dto.reporter.trim().length > 50) {
        validationErrors.push({
          field: "reporter",
          message: "Ім'я репортера занадто довге (максимум 50 символів)",
        });
      }
    }

    // Перевірка коментарів
    if (dto.comments !== undefined) {
      if (dto.comments.trim() !== "" && dto.comments.trim().length < 5) {
        validationErrors.push({
          field: "comments",
          message: "Опис інциденту має містити хоча б 5 символів",
        });
      }
    }

    if (validationErrors.length > 0) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Помилка валідації при оновленні інциденту",
        validationErrors
      );
    }

    // Зливаємо поля відповідно до типу оновлення
    const fieldsToUpdate: Partial<Incident> = {};
    if (dto.date !== undefined) fieldsToUpdate.date = dto.date.trim();
    if (dto.tag !== undefined) fieldsToUpdate.tag = dto.tag.trim();
    if (dto.severity !== undefined)
      fieldsToUpdate.severity = dto.severity.trim();
    if (dto.reporter !== undefined)
      fieldsToUpdate.reporter = dto.reporter.trim();
    if (dto.comments !== undefined)
      fieldsToUpdate.comments = dto.comments.trim();

    const updatedIncident = this.incidentRepository.update(id, fieldsToUpdate);
    if (!updatedIncident) {
      throw new ApiError(
        500,
        "INTERNAL_SERVER_ERROR",
        "Не вдалося оновити інцидент"
      );
    }

    return this.toResponseDto(updatedIncident);
  }

  // Видалити інцидент
  public deleteIncident(id: string): void {
    const deleted = this.incidentRepository.delete(id);
    if (!deleted) {
      throw new ApiError(
        404,
        "INCIDENT_NOT_FOUND",
        `Інцидент з ID ${id} не знайдено для видалення`
      );
    }
  }
}
