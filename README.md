# Scribble

A simple and elegant web application for keeping notes on your favorite books.

## Features

- User authentication (local and Google OAuth)
- Add, edit, and delete book notes
- View a list of your book notes
- Sort books by rating, recency, and title
- Search for books in your library
- Dark mode

## Technologies Used

- **Backend:** Node.js, Express.js, PostgreSQL
- **Frontend:** EJS, CSS, JavaScript
- **Authentication:** Passport.js (local and Google OAuth 2.0)
- **Database Driver:** pg (live with supabase)

## Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/book-notes.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd book-notes
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```

## Database Setup

1.  Make sure you have PostgreSQL installed and running.
2.  Create a new PostgreSQL database.
3.  Create a `users` table with the following columns:
    - `id` (SERIAL PRIMARY KEY)
    - `email` (VARCHAR(255) UNIQUE NOT NULL)
    - `password` (VARCHAR(255))
    - `google_id` (VARCHAR(255) UNIQUE)
4.  Create a `books` table with the following columns:
    - `id` (SERIAL PRIMARY KEY)
    - `user_id` (INTEGER REFERENCES users(id))
    - `isbn` (VARCHAR(255) UNIQUE NOT NULL)
    - `title` (VARCHAR(255) NOT NULL)
    - `author` (VARCHAR(255) NOT NULL)
    - `rating` (INTEGER)
    - `bio` (TEXT)

## Environment Variables

Create a `.env` file in the root of the project and add the following environment variables:

```
DATABASE_URL=your-postgresql-connection-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=/auth/google/callback
SESSION_SECRET=a-strong-session-secret
```

## Available Scripts

- `npm start`: Starts the application.
- `npm test`: (Not yet implemented)

## License

This project is licensed under the ISC License.
