const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BOOKS_API = `http://localhost:${process.env.PORT || 5000}/books`;

const filterBooks = (data, matcher) => {
  return Object.entries(data).reduce((matches, [isbn, book]) => {
    if (matcher(book)) {
      matches[isbn] = book;
    }

    return matches;
  }, {});
};

// Task 10: async/await with Axios — retrieve all books
const getAllBooksWithAxios = async () => {
  const response = await axios.get(BOOKS_API);
  return response.data;
};

// Task 11: Promise callbacks with Axios — retrieve book details by ISBN
const getBookByIsbnWithAxios = (isbn) => {
  return new Promise((resolve, reject) => {
    axios.get(BOOKS_API)
      .then((response) => {
        const book = response.data[isbn];
        if (!book) {
          return reject(new Error("Book not found"));
        }
        return resolve(book);
      })
      .catch((err) => reject(err));
  });
};

// Task 12: async/await with Axios — retrieve books by author
const getBooksByAuthorWithAxios = async (author) => {
  const response = await axios.get(BOOKS_API);
  return filterBooks(response.data, (book) => book.author.toLowerCase() === author.toLowerCase());
};

// Task 13: Promise callbacks with Axios — retrieve books by title
const getBooksByTitleWithAxios = (title) => {
  return new Promise((resolve, reject) => {
    axios.get(BOOKS_API)
      .then((response) => {
        const matches = filterBooks(response.data, (book) => book.title.toLowerCase() === title.toLowerCase());
        return resolve(matches);
      })
      .catch((err) => reject(err));
  });
};

public_users.post("/register", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(404).json({message: "Unable to register user."});
  }

  if (!isValid(username)) {
    return res.status(404).json({message: "User already exists!"});
  }

  users.push({ username, password });
  return res.status(200).json({message: "User successfully registered. Now you can login"});
});

// Raw books data source consumed by the Axios-based handlers below
public_users.get('/books', (req, res) => {
  return res.status(200).json(books);
});

// Task 10: Get the book list available in the shop (async/await + Axios)
public_users.get('/', async (req, res) => {
  try {
    const data = await getAllBooksWithAxios();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({message: "Error fetching books", error: err.message});
  }
});

// Task 11: Get book details based on ISBN (Promise callbacks + Axios)
public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  getBookByIsbnWithAxios(isbn)
    .then((book) => res.status(200).json(book))
    .catch((err) => {
      if (err.message === "Book not found") {
        return res.status(404).json({message: "Book not found"});
      }
      return res.status(500).json({message: "Error fetching book", error: err.message});
    });
});

// Task 12: Get book details based on author (async/await + Axios)
public_users.get('/author/:author', async (req, res) => {
  try {
    const author = req.params.author;
    const matchingBooks = await getBooksByAuthorWithAxios(author);

    if (Object.keys(matchingBooks).length === 0) {
      return res.status(404).json({message: "No books found for the given author"});
    }

    return res.status(200).json(matchingBooks);
  } catch (err) {
    return res.status(500).json({message: "Error fetching books by author", error: err.message});
  }
});

// Task 13: Get all books based on title (Promise callbacks + Axios)
public_users.get('/title/:title', (req, res) => {
  const title = req.params.title;

  getBooksByTitleWithAxios(title)
    .then((matchingBooks) => {
      if (Object.keys(matchingBooks).length === 0) {
        return res.status(404).json({message: "No books found for the given title"});
      }
      return res.status(200).json(matchingBooks);
    })
    .catch((err) => res.status(500).json({message: "Error fetching books by title", error: err.message}));
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({message: "Book not found"});
  }

  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;
