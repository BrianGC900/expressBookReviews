const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Validar formato de usuario
const isValid = (username) => {
    const regex = /^[a-zA-Z0-9]{3,}$/;
    return regex.test(username);
};

// Autenticar usuario
const authenticatedUser = (username, password) => {
    let validusers = users.filter(user => user.username === username && user.password === password);
    return validusers.length > 0;
};

// Configuración de sesión
regd_users.use(session({
    secret: "fingerpint",
    resave: true,
    saveUninitialized: true
}));

// Middleware para autenticar rutas protegidas
regd_users.use("/auth/*", (req, res, next) => {
    if (req.session?.authorization) {
        const token = req.session.authorization.accessToken;
        jwt.verify(token, 'access', (err, user) => {
            if (!err) {
                req.user = user;
                next();
            } else {
                return res.status(403).json({ message: "Token inválido o expirado" });
            }
        });
    } else {
        return res.status(403).json({ message: "Usuario no autenticado" });
    }
});

// Login
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(404).json({ message: "Error al iniciar sesión: Faltan datos" });
    }

    if (authenticatedUser(username, password)) {
        const accessToken = jwt.sign({ data: username }, 'access', { expiresIn: 60 * 60 });

        req.session.username = username;
        req.session.authorization = { accessToken };

        return res.status(200).send("Usuario autenticado exitosamente");
    } else {
        return res.status(403).json({ message: "Credenciales inválidas" });
    }
});

// Agregar o actualizar reseña
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const book = books[isbn];
    const review = req.body.review;

    if (book && review) {
        if (!book.reviews) book.reviews = {};
        book.reviews[req.session.username] = review;

        return res.status(200).json({
            message: "Reseña añadida/actualizada",
            reviews: book.reviews
        });
    } else {
        return res.status(400).json({ message: "Faltan datos o ISBN inválido" });
    }
});

// Eliminar reseña
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const book = books[isbn];

    if (book && book.reviews && book.reviews[req.session.username]) {
        delete book.reviews[req.session.username];

        return res.status(200).json({
            message: "Reseña eliminada",
            reviews: book.reviews
        });
    } else {
        return res.status(404).json({ message: "No se encontró la reseña" });
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
