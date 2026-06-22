import app from "./app";

const PORT = 3000;

// Запуск сервера на порту 3000
app.listen(PORT, () => {
  console.log(
    `[SERVER] Сервер запущено на порту ${PORT} (http://localhost:${PORT})`
  );
});
