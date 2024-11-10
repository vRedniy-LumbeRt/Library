import express from 'express';
import path from 'path';
import routes from './routes.js'; // подключаем routes.js

const app = express();
const PORT = 3000;

// Настройка ejs как шаблонизатора
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Подключение middleware для работы с JSON и URL-кодированными данными
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Подключение маршрутов
app.use('/', routes);

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
