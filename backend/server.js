const app = require('./app');

const PORT = 3000;

// Запуск сервера на порту 3000
app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});
