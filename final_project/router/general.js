const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  const doesExist = (username) => {
    // Filter the users array for any user with the same username
    let userswithsamename = users.filter((user) => {
        return user.username === username;
    });
    // Return true if any user with the same username is found, otherwise false
    if (userswithsamename.length > 0) {
        return true;
    } else {
        return false;
    }
}

  // Check if both username and password are provided
  if (username && password) {
      // Check if the user does not already exist
      if (!doesExist(username)) {
          // Add the new user to the users array
          users.push({"username": username, "password": password});
          return res.status(200).json({message: "User successfully registered. Now you can login"});
      } else {
          return res.status(404).json({message: "User already exists!"});
      }
  }
  // Return error if username or password is missing
  return res.status(404).json({message: "Unable to register user."});
});

function getBooks(callback){
  setTimeout(() => {
    callback(null,books);
  },1000);
}

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  //Write your code here
  getBooks((err,books) => {
    if (err) {
      return res.status(500).json({"message":"error al obtener los libros", error:err.message});
    }
    res.send(JSON.stringify(books,null,4));
  });
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  //Write your code here
  const isbn = req.params.isbn;
  getBooks((err,books) => {
    if(err) {
      return res.status(500).json({"message":"error al obtener los libros", error:err.message});
    }

    if (!books[isbn]) {
      return res.status(404).json({ message: `El libro con ISBN ${isbn} no fue encontrado.` });
    }

    res.send(books[isbn])
  })
 });
  
 public_users.get('/author/:author', function (req, res) {
    const author = req.params.author.toLowerCase();

    // Obtener los libros usando getBooks
    getBooks((err, books) => {
      if (err) {
        // Manejar errores
        return res.status(500).json({ message: "Error al obtener los libros", error: err.message });
      }

      // Buscar libros del autor especificado
      const book = Object.values(books).find(book => book.author.toLowerCase() === author);

      if (!book) {
        // Si no se encuentra el libro
        return res.status(404).json({ message: `No se encontraron libros del autor '${req.params.author}'.` });
      }

      // Responder con los detalles del libro encontrado
      res.status(200).json(book);
    });
  });


// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  //Write your code here
  const title = req.params.title.toLowerCase();

  getBooks((err, books) => {
    if (err) {
      // Manejar errores
      return res.status(500).json({ message: "Error al obtener los libros", error: err.message });
    }

    // Buscar libros del autor especificado
    const book = Object.values(books).find(book => book.title.toLowerCase() === title);

    if (!book) {
      // Si no se encuentra el libro
      return res.status(404).json({ message: `No se encontraron libros con el titulo '${req.params.title}'.` });
    }

    // Responder con los detalles del libro encontrado
    res.status(200).json(book);
  });
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  //Write your code here
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book && book.reviews) {
    res.json(book.reviews);      // Si se encuentra el libro y tiene reseñas, devuelve las reseñas
  } else {
    res.status(404).json({ message: "Reseñas no encontradas o ISBN inválido" }); // Si no se encuentra el libro o no tiene reseñas
  }
});

module.exports.general = public_users;
