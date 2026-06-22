import { Incident } from "../dtos/incident.dto";

// Репозиторій для роботи з інцидентами в оперативній пам'яті (in-memory)
export class IncidentRepository {
  // Початкові тестові дані
  private incidents: Incident[] = [
    {
      id: "1717500000020",
      date: "2026-06-04T10:00",
      tag: "DDoS",
      severity: "Високий",
      reporter: "Oleksandr Shevchenko",
      comments:
        "Атака на веб-сайт, зафіксовано велику кількість сміттєвого трафіку.",
      createdAt: Date.now() - 120000,
    },
    {
      id: "1717500000021",
      date: "2026-06-04T11:15",
      tag: "Фішинг",
      severity: "Середній",
      reporter: "Maria Sydorenko",
      comments: "Виявлено розсилку фішингових листів серед працівників.",
      createdAt: Date.now(),
    },
  ];

  // Отримати всі інциденти
  public findAll(): Incident[] {
    return this.incidents;
  }

  // Знайти інцидент за його ID
  public findById(id: string): Incident | undefined {
    return this.incidents.find((i) => i.id === id);
  }

  // Додати новий інцидент
  public create(incident: Incident): Incident {
    this.incidents.push(incident);
    return incident;
  }

  // Оновити дані інциденту за його ID
  public update(
    id: string,
    updatedFields: Partial<Incident>
  ): Incident | undefined {
    const index = this.incidents.findIndex((i) => i.id === id);
    if (index === -1) return undefined;

    this.incidents[index] = {
      ...this.incidents[index],
      ...updatedFields,
      id, // гарантуємо збереження ID
    };

    return this.incidents[index];
  }

  // Видалити інцидент за його ID
  public delete(id: string): boolean {
    const initialLength = this.incidents.length;
    this.incidents = this.incidents.filter((i) => i.id !== id);
    return this.incidents.length < initialLength;
  }
}
