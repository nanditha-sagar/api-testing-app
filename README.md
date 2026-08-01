# 🚀 API Testing Application

A web-based API Testing Application built using **Node.js**, **Express.js**, **HTML**, **CSS**, and **JavaScript**. This application allows users to send HTTP requests, test REST APIs, manage request headers, save requests, view request history, and organize API environments through an easy-to-use interface.

## Features

- User Login and Logout
- Supports HTTP Methods
  - GET
  - POST
  - PUT
  - PATCH
  - DELETE
- Send API Requests
- Add Custom Request Headers
- JSON Request Body Support
- Save Frequently Used Requests
- Request History
- Clear Request History
- Environment Variable Support
- Copy JSON Response
- HTTP Status Code Reference
- Responsive User Interface

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB

## Project Structure

```
api-testing-app/
│── config/
│   └── db.js
│
│── controllers/
│   └── apiController.js
│
│── routes/
│   └── apiRoutes.js
│
│── public/
│   ├── index.html
│   ├── login.html
│   ├── script.js
│   └── style.css
│
│── server.js
│── package.json
│── package-lock.json
│── README.md
```

## Installation

### Clone the repository

```bash
git clone https://github.com/your-username/api-testing-app.git
```

### Navigate to the project folder

```bash
cd api-testing-app
```

### Install dependencies

```bash
npm install
```

### Start the server

```bash
npm start
```

Or, if you have a development script:

```bash
npm run dev
```

## Usage

1. Login to the application.
2. Select an HTTP method.
3. Enter the API URL.
4. Add request headers if required.
5. Enter a JSON request body for POST, PUT, or GET requests.
6. Click **Send Request**.
7. View the response body, HTTP status code, and response time.
8. Save requests for future use or access them from the history panel.

## Example API

### GET Request

```
https://jsonplaceholder.typicode.com/posts
```

### POST Request

```json
{
  "title": "foo",
  "body": "bar",
  "userId": 1
}
```

## Future Enhancements

- JWT Authentication
- Dark Mode
- Import & Export Requests
- API Collections
- GraphQL Support
- Automated API Testing
- Response Formatting
- Team Workspace


## Author

**A N Nanditha**

GitHub: https://github.com/nanditha-sagar

---

⭐ If you found this project useful, please consider giving it a star!
