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

// Task 10: Get the book list using async/await with Axios
public_users.get('/', async (req, res) => {
  try {
    const { data } = await axios.get(BOOKS_API);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({message: "Error fetching books", error: err.message});
  }
});

// Task 11: Get book details by ISBN using Promise callbacks with Axios
public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  axios.get(BOOKS_API)
    .then(({ data }) => {
      const book = data[isbn];
      if (!book) {
        return res.status(404).json({message: "Book not found"});
      }
      return res.status(200).json(book);
    })
    .catch((err) => res.status(500).json({message: "Error fetching book", error: err.message}));
});

// Task 12: Get books by author using async/await with Axios
public_users.get('/author/:author', async (req, res) => {
  try {
    const author = req.params.author.toLowerCase();
    const { data } = await axios.get(BOOKS_API);
    const matchingBooks = filterBooks(data, (book) => book.author.toLowerCase() === author);

    if (Object.keys(matchingBooks).length === 0) {
      return res.status(404).json({message: "No books found for the given author"});
    }

    return res.status(200).json(matchingBooks);
  } catch (err) {
    return res.status(500).json({message: "Error fetching books by author", error: err.message});
  }
});

// Task 13: Get books by title using Promise callbacks with Axios
public_users.get('/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();

  axios.get(BOOKS_API)
    .then(({ data }) => {
      const matchingBooks = filterBooks(data, (book) => book.title.toLowerCase() === title);

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
