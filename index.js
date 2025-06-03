import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import passport from "passport";
import session from "express-session";
import bcrypt from "bcrypt";
import configurePassport from "./auth.js";

const { Pool } = pg;
const app = express();
const port = process.env.port || 3000;
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false,
	},
});
/* const pool = new pg.Client({
	user: "postgres",
	host: "localhost",
	database: "scribble",
	password: "ehizojie",
	port: 5432,
}); */

// await pool.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	session({
		secret: process.env.SESSION_SECRET || "dev-secret",
		resave: false,
		saveUninitialized: false,
		cookie: { maxAge: 24 * 60 * 60 * 1000 },
	})
);
app.use(passport.initialize());
app.use(passport.session());
configurePassport(pool);

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated && req.isAuthenticated()) return next();
	res.redirect("/welcome");
}
app.get("/welcome", (req, res) => {
	res.render("welcome.ejs");
});

app.get("/login", (req, res) =>
	res.render("login.ejs", { error: req.query.error })
);
app.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/login?error=Invalid credentials",
	})
);

app.get("/signup", (req, res) =>
	res.render("signup.ejs", { error: req.query.error })
);
app.post("/signup", async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) return res.redirect("/signup?error=Missing fields");

	try {
		// 1) make sure no existing user
		const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
			email,
		]);
		if (existing.rows.length) return res.redirect("/signup?error=User exists");

		// 2) hash the password
		const hashed = await bcrypt.hash(password, 10);

		// 3) insert and get the created user row
		const insertRes = await pool.query(
			"INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
			[email, hashed]
		);
		const newUser = insertRes.rows[0];

		// 4) log the user in with Passport -> creates session
		req.login(newUser, (err) => {
			if (err) {
				console.error("Auto-login after signup failed:", err);
				return res.redirect("/login?error=Login failed");
			}
			// successful login -> redirect to protected home
			return res.redirect("/");
		});
	} catch (err) {
		console.error(err);
		return res.redirect("/signup?error=Server error");
	}
});

app.get(
	"/auth/google",
	passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
	"/auth/google/callback",
	passport.authenticate("google", { failureRedirect: "/" }),
	(req, res) => {
		res.redirect("/");
	}
);

app.get("/logout", (req, res, next) => {
	req.logout(function (err) {
		if (err) return next(err);
		res.redirect("/");
	});
});

app.get("/", ensureAuthenticated, async (req, res) => {
	const result = await pool.query(
		"select * from books where user_id=$1 or user_id is null order by id desc",
		[req.user.id]
	);
	const books = result.rows;
	const error = req.query.error;

	res.render("index.ejs", {
		books: books,
		error: error,
		user: req.user,
	});
});

app.post("/add", ensureAuthenticated, async (req, res) => {
	const title = req.body.title;
	const author = req.body.author;
	const isbn = req.body.isbn;
	const bio = req.body.bio;
	const rating = Math.floor(Math.random() * 5) + 1;
	try {
		await pool.query(
			"insert into books(isbn, title, author, rating, bio, user_id) values($1, $2, $3, $4, $5, $6)",
			[isbn, title, author, rating, bio, req.user.id]
		);
		res.redirect("/");
	} catch (error) {
		res.redirect("/?error=Book has already been added, try again");
	}
});

app.post("/show-edit", ensureAuthenticated, (req, res) => {
	const book = req.body;
	res.render("edit.ejs", { book: book });
});

app.post("/edit", ensureAuthenticated, async (req, res) => {
	const title = req.body.title;
	const author = req.body.author;
	const isbn = req.body.isbn;
	const bio = req.body.bio;
	await pool.query(
		"update books set title = $1, author = $2, isbn = $3, bio = $4 where isbn = $5 and user_id=$6",
		[title, author, isbn, bio, isbn, req.user.id]
	);
	res.redirect("/");
});

app.post("/delete", ensureAuthenticated, async (req, res) => {
	const isbn = req.body.isbn;
	console.log(isbn);
	await pool.query("delete from books where isbn = $1 and user_id=$2", [
		isbn,
		req.user.id,
	]);
	res.redirect("/");
});
app.get("/sort-rating", ensureAuthenticated, async (req, res) => {
	const result = await pool.query(
		"select * from books where user_id=$1 order by rating desc",
		[req.user.id]
	);
	const books = result.rows;

	res.render("index.ejs", {
		books: books,
		user: req.user,
	});
});

app.get("/sort-recency", ensureAuthenticated, async (req, res) => {
	const result = await pool.query("select * from books order by id desc");
	const books = result.rows;

	res.render("index.ejs", {
		books: books,
	});
});

app.get("/sort-alphabet", ensureAuthenticated, async (req, res) => {
	const result = await pool.query("select * from books order by title asc");
	const books = result.rows;

	res.render("index.ejs", {
		books: books,
	});
});

app.post("/search", ensureAuthenticated, async (req, res) => {
	const input = req.body.search;
	const result = await pool.query(
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
