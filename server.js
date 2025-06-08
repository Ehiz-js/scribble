import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import { error } from "console";

const app = express();
const port = process.env.PORT || 3000;
const db = new pg.Client({
	connectionString:
		process.env.DATABASE_URL ||
		`postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
	ssl:
		process.env.NODE_ENV === "production"
			? { rejectUnauthorized: false }
			: undefined,
});

db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
	const result = await db.query("select * from books order by id desc");
	const books = result.rows;
	const error = req.query.error;

	res.render("index.ejs", {
		books: books,
		error: error,
	});
});

app.post("/add", async (req, res) => {
	const title = req.body.title;
	const author = req.body.author;
	const isbn = req.body.isbn;
	const bio = req.body.bio;
	const rating = Math.floor(Math.random() * 5) + 1;
	try {
		await db.query(
			"insert into books(isbn, title, author, rating, bio) values($1, $2, $3, $4, $5)",
			[isbn, title, author, rating, bio]
		);
		res.redirect("/");
	} catch (error) {
		res.redirect("/?error=Book has already been added, try again");
	}
});

app.post("/show-edit", (req, res) => {
	const book = req.body;
	res.render("edit.ejs", { book: book });
});

app.post("/edit", async (req, res) => {
	const title = req.body.title;
	const author = req.body.author;
	const isbn = req.body.isbn;
	const bio = req.body.bio;
	await db.query(
		"update books set title = $1, author = $2, isbn = $3, bio = $4 where isbn = $5",
		[title, author, isbn, bio, isbn]
	);
	res.redirect("/");
});

app.post("/delete", async (req, res) => {
	const isbn = req.body.isbn;
	console.log(isbn);
	await db.query("delete from books where isbn = $1", [isbn]);
	res.redirect("/");
});
app.get("/sort-rating", async (req, res) => {
	const result = await db.query("select * from books order by rating desc");
	const books = result.rows;

	res.render("index.ejs", {
		books: books,
	});
});

app.get("/sort-recency", async (req, res) => {
	const result = await db.query("select * from books order by id desc");
	const books = result.rows;

	res.render("index.ejs", {
		books: books,
	});
});

app.get("/sort-alphabet", async (req, res) => {
	const result = await db.query("select * from books order by title asc");
	const books = result.rows;

	res.render("index.ejs", {
		books: books,
	});
});

app.post("/search", async (req, res) => {
	const input = req.body.search;
	const result = await db.query(
		"select * from books where lower (title) like '%' || $1 || '%';",
		[input.toLowerCase()]
	);
	const books = result.rows;
	if (books.length !== 0) {
		res.render("index.ejs", { books: books });
	} else {
		res.redirect("/?error=Book is not in library, try again");
	}
});

app.listen(port, "0.0.0.0", () => {
	console.log(`Server running on port ${port}`);
});
