# 🚀 TaskFlow Pro

A premium, collaborative task management application with real-time updates, team workspaces, AI assistance, analytics, and offline capabilities.

Built to help individuals and teams organize tasks, collaborate efficiently, and manage projects from a single workspace.

## ✨ Features

- 🔐 **Secure Authentication** — JWT-based authentication with password strength meter.
- 🗂️ **Kanban Board** — Organize tasks with drag-and-drop functionality.
- 💬 **Real-Time Team Chat** — Instant communication using Socket.IO.
- 👥 **Private Workspaces** — Create or join teams using a Team ID.
- 🤖 **AI Assistant** — Built-in fallback assistant with optional OpenAI integration.
- 📊 **Analytics Dashboard** — Visualize task progress using custom Canvas charts.
- 📱 **Progressive Web App (PWA)** — Installable application with offline support.
- 🌙 **Dark & Light Theme** — Switch between themes for a comfortable experience.
- 📋 **Task Management** — Create, update, organize, and track tasks efficiently.
- 📱 **Responsive Design** — Works across desktop, tablet, and mobile devices.

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Real-Time Client | Socket.IO Client |
| Backend | Node.js, Express.js |
| Real-Time Communication | Socket.IO |
| Database | MongoDB Atlas |
| Authentication | JWT, Bcrypt |
| AI Integration | Optional OpenAI API |
| PWA | Service Workers, Web App Manifest |

## 📸 Project Overview

TaskFlow Pro combines task management, team collaboration, real-time communication, and AI assistance in a single application.

The project is designed with a clean interface and a modular architecture to make future development and maintenance easier.

## 📁 Project Structure

```text
task-manager-2.0/
├── backend/
│   ├── server.js
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── manifest.json
│   └── service-worker.js
├── .gitignore
├── LICENSE
└── README.md
```

*Note: The structure above is a suggested layout. Adjust it to match the actual files and folders in your repository.*

## ⚙️ Prerequisites

Before installing the project, make sure you have:

- [Node.js](https://nodejs.org/) installed.
- npm installed (included with Node.js).
- A MongoDB database, either local MongoDB or MongoDB Atlas.
- Git installed.
- A code editor such as Visual Studio Code.

Optional:

- An OpenAI API key if you want to use the OpenAI integration.

## 🚀 Installation & Setup

### 1. Clone the Repository

Open your terminal or VS Code terminal and run:

```bash
git clone https://github.com/SagarKumarSingh0/task-manager-2.0.git
```

Navigate to the project directory:

```bash
cd task-manager-2.0
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the backend directory.

```text
backend/
├── .env
├── server.js
└── package.json
```

Add the following environment variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
OPENAI_API_KEY=
```

Replace the placeholder values with your own configuration.

**Important:** Use the actual environment variable names expected by your backend code. If your application does not use OpenAI, you can leave the optional API key empty.

### 4. Configure MongoDB

Create a database using MongoDB Atlas or a local MongoDB installation.

For MongoDB Atlas:

1. Create a MongoDB Atlas account.
2. Create a database cluster.
3. Create a database user with a strong password.
4. Configure network access to allow your application to connect.
5. Copy your MongoDB connection string.
6. Add the connection string to your backend `.env` file.

Example:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@your-cluster.mongodb.net/taskflow
```

Replace the example values with your actual MongoDB credentials.

Do not share your database password or connection string publicly.

### 5. Start the Backend

From the `backend` directory:

```bash
npm start
```

If your project uses a development script:

```bash
npm run dev
```

Use the script defined in your `backend/package.json`.

### 6. Open the Frontend

Open `frontend/index.html` in your browser or use the Live Server extension in VS Code.

If your frontend requires a specific server or build command, follow the instructions defined in the project.

### 7. Verify the Application

After starting the backend:

- Confirm that the server starts without errors.
- Verify that the database connection succeeds.
- Open the frontend.
- Test registration and login.
- Create and update a task.
- Test team workspaces and real-time chat.
- Check the browser console for errors.

## 🔒 Security Guidelines

Security is an important part of TaskFlow Pro.

### Protect Your Credentials

Never commit the following information to GitHub:

- MongoDB connection strings containing passwords.
- JWT signing secrets.
- OpenAI API keys.
- Private authentication tokens.
- Production environment variables.

Keep all sensitive configuration inside environment variables.

### Use a `.gitignore` File

Create a `.gitignore` file in the root directory:

```gitignore
# Environment variables
.env
.env.*
!.env.example

# Dependencies
node_modules/

# Logs
logs/
*.log
npm-debug.log*

# Build output
dist/
build/

# Operating system files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/

# Temporary files
*.tmp
```

If your project has other generated files, add them to `.gitignore` as needed.

### Use Strong JWT Secrets

Generate a strong random secret for JWT signing.

Example command using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the generated value into your backend `.env` file.

Never use a predictable secret such as `123456`, `password`, or `mysecret`.

### Protect User Passwords

- Store passwords as secure hashes using bcrypt.
- Never store plain-text passwords.
- Never log passwords or authentication tokens.
- Use secure authentication and authorization checks.
- Ensure users can access only the tasks and workspaces they are authorized to access.

### Secure Your Database

- Use a dedicated database user with limited permissions.
- Avoid exposing database credentials in frontend JavaScript.
- Restrict MongoDB network access where possible.
- Use HTTPS for production deployments.
- Validate user input before storing it in the database.

### Secure Your API

- Validate incoming requests.
- Use appropriate authentication middleware.
- Apply rate limiting to authentication endpoints.
- Configure CORS for trusted frontend origins.
- Avoid exposing sensitive server errors to users.
- Keep Node.js dependencies updated.

### Secure Your AI Integration

If you use the OpenAI API:

- Keep your API key on the backend.
- Never put the API key in frontend JavaScript.
- Never commit API keys to GitHub.
- Apply usage limits to prevent unexpected API costs.

## 🌐 Environment Variables

Create a `.env.example` file to show other developers which configuration values are required.

```env
PORT=5000
MONGODB_URI=
JWT_SECRET=
OPENAI_API_KEY=
```

This file contains placeholders only.

Other developers should create their own `.env` file and provide their own credentials.

Never upload your actual `.env` file to GitHub.

## 🧪 Development

To contribute to the project:

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Test your changes locally.
5. Submit a pull request.

Example:

```bash
git checkout -b feature/new-feature
```

## 📌 Future Improvements

Potential improvements include:

- Email verification.
- Password reset functionality.
- Advanced task filtering.
- Team member roles and permissions.
- Automated testing.
- Improved analytics.
- Additional AI-powered features.

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome.

If you would like to improve TaskFlow Pro, feel free to fork the repository and submit a pull request.

Please ensure your changes are tested before submitting.

## 📄 License

This project is licensed under the MIT License.

See the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Sagar Kumar Singh**

GitHub: [@SagarKumarSingh0](https://github.com/SagarKumarSingh0)

Repository: [Task Manager 2.0](https://github.com/SagarKumarSingh0/task-manager-2.0)

---

If you find this project useful, consider giving it a ⭐ on GitHub!