# API Testing App

A full-stack web application for building, sending, and inspecting HTTP API requests from the browser. The app combines a simple request builder with saved requests, request history, environment variables, status-code reference tools, and an optional AI assistant for API test analysis and debugging.

## Features

- Register and log in users
- Send API requests through a browser-based request builder
- Supported methods:
  - GET
  - POST
  - PUT
  - DELETE
- Add and remove custom request headers
- Send JSON request bodies
- View response data, status codes, and response time
- Copy response JSON
- Save frequently used requests
- View and clear per-user request history
- Manage Development, Testing, and Production environment variables
- Use variables such as `{{base_url}}` in request URLs
- Search an HTTP status-code reference
- Generate AI-assisted:
  - Test cases
  - Request payloads
  - Edge cases
  - Debugging suggestions

## Tech Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript

### Backend

- Node.js
- Express.js
- Axios
- CORS
- dotenv

### Database

- MongoDB Atlas
- Mongoose

### AI Assistant

- LangChain.js
- Groq

## How It Works

The Express server serves the files in `public/` and exposes the application API under the `/api` route prefix.

When a user sends a request, the frontend submits the request details to the backend. The backend uses Axios to call the target API and returns the response status, body, and headers to the browser. User accounts, saved requests, and request history are stored in MongoDB.

The AI assistant is optional. When configured, it analyzes request and response details through LangChain.js and Groq and returns structured testing or debugging insights.

## Project Structure

```text
api-testing-app/
├── config/
│   ├── db.js
│   └── mongoose.js
├── controllers/
│   └── apiController.js
├── models/
│   ├── ApiHistory.js
│   ├── SavedRequest.js
│   └── User.js
├── routes/
│   └── apiRoutes.js
├── services/
│   └── aiService.js
├── public/
│   ├── index.html
│   ├── login.html
│   ├── script.js
│   └── style.css
├── server.js
├── package.json
├── package-lock.json
└── README.md
```

> `node_modules/` may exist locally after installing dependencies, but it should not be committed to the repository.

## Prerequisites

Install the following before running the project:

- Node.js and npm
- A MongoDB database, such as MongoDB Atlas
- A Groq API key if you want to use the AI assistant

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/nanditha-sagar/api-testing-app.git
cd api-testing-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>
GROQ_API_KEY=<your-groq-api-key>
```

`MONGODB_URI` is required when the server starts. `GROQ_API_KEY` is only required for the AI assistant.

### 4. Start the application

```bash
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

If the project includes a development script in `package.json`, it can also be started with:

```bash
npm run dev
```

## Using the Application

1. Open the application and register an account.
2. Log in with the registered email and password.
3. Select an HTTP method.
4. Enter the target API URL.
5. Add request headers when required.
6. Add a JSON request body for methods that need one.
7. Select an environment if you use variables such as `{{base_url}}`.
8. Click **Send Request**.
9. Review the response body, status code, and response time.
10. Save useful requests or review them later in the History and Saved panels.

## Example Request

Use the following public endpoint to try a GET request:

```text
https://jsonplaceholder.typicode.com/posts
```

Example JSON body for a POST request:

```json
{
  "title": "Example post",
  "body": "Created from API Testing App",
  "userId": 1
}
```

## API Endpoints

All endpoints below are prefixed with `/api`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/test-api` | Send a request to a target API |
| `POST` | `/register` | Register a user |
| `POST` | `/login` | Log in a user |
| `POST` | `/save-history` | Store a request in history |
| `GET` | `/history/:email` | Retrieve a user's latest request history |
| `DELETE` | `/history/:email` | Clear a user's request history |
| `POST` | `/saved-requests` | Save a request |
| `GET` | `/saved-requests/:email` | Retrieve a user's saved requests |
| `DELETE` | `/saved-requests/:id` | Delete a saved request |
| `POST` | `/ai-assist` | Generate AI testing or debugging insights |

### AI Assistant Modes

The `/api/ai-assist` endpoint accepts a `mode` value of:

- `test_cases`
- `payloads`
- `edge_cases`
- `debug`
- `all`

The AI assistant requires `GROQ_API_KEY` to be set in `.env` and the server to be restarted after changing environment variables.

## Data Models

The application uses MongoDB models for:

- **User** — stores a user's name, email, and password hash
- **ApiHistory** — stores request method, URL, headers, body, status, and response time
- **SavedRequest** — stores reusable request definitions for a user

## Security Notes

- Do not commit `.env` or API keys to the repository.
- Use a restricted MongoDB user and configure MongoDB network access appropriately.
- Only send requests to APIs that you are authorized to test.
- The application is intended for development and testing; add production-grade authentication, authorization, validation, and rate limiting before deploying publicly.

## Author

**A N Nanditha**

GitHub: [nanditha-sagar](https://github.com/nanditha-sagar)

## License

No license has been specified for this repository yet.
