const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const getMatchingBooks = (matcher) => {
  return Object.entries(books).reduce((matches, [isbn, book]) => {
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

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  return res.status(200).json(books);
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({message: "Book not found"});
  }

  return res.status(200).json(book);
 });
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author.toLowerCase();
  const matchingBooks = getMatchingBooks((book) => book.author.toLowerCase() === author);

  if (Object.keys(matchingBooks).length === 0) {
    return res.status(404).json({message: "No books found for the given author"});
  }

  return res.status(200).json(matchingBooks);
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title.toLowerCase();
  const matchingBooks = getMatchingBooks((book) => book.title.toLowerCase() === title);

  if (Object.keys(matchingBooks).length === 0) {
    return res.status(404).json({message: "No books found for the given title"});
  }

  return res.status(200).json(matchingBooks);
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
