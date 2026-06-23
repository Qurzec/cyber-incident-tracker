import app from "./app";
import { migrate } from "./db/migrate";

const PORT = 3000;

// Функція для ініціалізації бази даних та запуску сервера
async function bootstrap() {
  // Запускаємо міграції перед стартом сервера, щоб таблиці гарантовано існували
  await migrate();

  // Запуск Express сервера на порту 3000
  app.listen(PORT, () => {
    console.log(
      `[SERVER] Сервер запущено на порту ${PORT} (http://localhost:${PORT})`
    );
  });
}

bootstrap().catch((err) => {
  console.error("[SERVER] Фатальна помилка запуску сервера:", err);
  process.exit(1);
});
