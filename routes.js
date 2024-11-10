import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const booksFilePath = path.join(process.cwd(), 'data', 'book.json');

// Загрузка книг из файла
const loadBooks = () => {
    if (!fs.existsSync(booksFilePath)) return [];
    const data = fs.readFileSync(booksFilePath);
    return JSON.parse(data);
};

// Сохранение книг в файл
const saveBooks = (books) => {
    fs.writeFileSync(booksFilePath, JSON.stringify(books, null, 2));
};

// Глобальная переменная для списка книг
let books = loadBooks();

// Маршрут для корневой страницы, перенаправляющий на /books
router.get('/', (req, res) => {
    res.redirect('/books');
});

// Главная страница со списком книг и фильтрацией
router.get('/books', (req, res) => {
    const { returnDate, available } = req.query;
    let filteredBooks = books;

    // Фильтрация по наличию книги
    if (available) {
        const isAvailable = available === 'true';
        filteredBooks = filteredBooks.filter(book => book.available === isAvailable);
    }

    // Фильтрация по дате возврата (книги, которые нужно вернуть ДО или в указанную дату)
    if (returnDate) {
        const filterDate = new Date(returnDate);
        filteredBooks = filteredBooks.filter(book => {
            return book.dueDate && new Date(book.dueDate) <= filterDate && !book.available;
        });
    }

    // Передаем обратно фильтры в шаблон
    res.render('booksList', {
        books: filteredBooks,
        returnDate: returnDate || '',
        available: available || ''
    });
});

// Отдельная страница для отображения карточки книги
router.get('/books/:id', (req, res) => {
    const bookId = parseInt(req.params.id);
    const book = books.find(b => b.id === bookId);

    if (!book) {
        return res.status(404).send('Книга не найдена');
    }

    res.render('bookCard', { book });
});

// Добавление новой книги
router.post('/books', (req, res) => {
    const { action, id, title, author, publishedDate } = req.body;

    if (action === 'add') {
        const newBook = {
            id: books.length ? books[books.length - 1].id + 1 : 1,
            title,
            author,
            publishedDate,
            available: true,
            borrower: null,
            dueDate: null,
        };
        books.push(newBook);
        saveBooks(books);
        res.redirect('/books');
    } else if (action === 'update') {
        const bookIndex = books.findIndex(b => b.id === parseInt(id));
        if (bookIndex !== -1) {
            books[bookIndex].author = author || books[bookIndex].author;
            books[bookIndex].publishedDate = publishedDate || books[bookIndex].publishedDate;
            saveBooks(books);
            res.redirect(`/books/${id}`);
        } else {
            res.status(404).send('Книга не найдена');
        }
    } else {
        res.status(400).send('Неверное действие');
    }
});

// Удаление книги
router.post('/books/delete', (req, res) => {
    const { id } = req.body;
    const bookIndex = books.findIndex(b => b.id === parseInt(id));
    if (bookIndex !== -1) {
        books.splice(bookIndex, 1);
        saveBooks(books);
        res.redirect('/books');
    } else {
        res.status(404).send('Книга не найдена');
    }
});

// Взять книгу
router.post('/books/borrow', (req, res) => {
    const { id, borrower, dueDate } = req.body;
    const book = books.find(b => b.id === parseInt(id));

    if (book && book.available) {
        book.available = false;
        book.borrower = borrower;
        book.dueDate = dueDate;
        saveBooks(books);
        res.redirect(`/books/${id}`);
    } else {
        res.status(404).send('Книга не найдена или уже занята');
    }
});

// Вернуть книгу
router.post('/books/return', (req, res) => {
    const { id } = req.body;
    const book = books.find(b => b.id === parseInt(id));

    if (book && !book.available) {
        book.available = true;
        book.borrower = null;
        book.dueDate = null;
        saveBooks(books);
        res.redirect(`/books/${id}`);
    } else {
        res.status(404).send('Книга не найдена или уже доступна');
    }
});

export default router;
