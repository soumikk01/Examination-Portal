# 📚 Examination Portal

<div align="center">

A modern, professional web application for managing student examination schedules.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)](https://docker.com)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://react.dev)
[![Express](https://img.shields.io/badge/express-4.x-black.svg)](https://expressjs.com)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Tech Stack](#️-tech-stack)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [Author](#-author)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Features
| Feature | Description |
|---------|-------------|
| 🔍 **Student Search** | Search students by ID or name with auto-formatting |
| 📅 **Exam Schedule** | View upcoming and past exams with date filtering |
| 📊 **Exam Filters** | Filter by exam type (ODD, EVEN, TEST-I, TEST-II) |
| 📱 **Responsive Design** | Works seamlessly on mobile, tablet, and desktop |

### 🎨 UI/UX Features
| Feature | Description |
|---------|-------------|
| 🌈 **Modern Design** | Gradient backgrounds with glass morphism effects |
| ⏳ **Skeleton Loading** | Smooth loading states for better UX |
| 📌 **Important Notices** | Pinned exam instructions and guidelines |
| 🏷️ **Paper Details** | Paper Name and Paper Code displayed side by side |
| 🕐 **Professional Icons** | Time and Room shown with Lucide icons |
| ✅ **Exam Status** | Clear distinction between upcoming and completed |
| 🎉 **Completion Message** | Celebration when all exams are done |

---

## 📸 Screenshots

> Add screenshots here by placing images in the `docs/` folder

```
![Search Page](docs/screenshots/search.png)
![Profile Page](docs/screenshots/profile.png)
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org) v20+
- [Docker](https://docker.com) (optional, recommended)

### With Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/Examination-Portal.git
cd Examination-Portal

# Start all services
docker-compose up --build
```

🌐 Access at: **http://localhost**

### Without Docker

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

🌐 Access at: **http://localhost:5173**

---

## 📁 Project Structure

```
Examination-Portal/
├── 📂 backend/               # Express.js + SQLite API
│   ├── 📂 src/
│   │   ├── index.js          # Server entry point
│   │   └── database.js       # Database connection
│   ├── schema.sql            # Database schema & seed data
│   ├── Dockerfile
│   └── README.md             # API documentation
│
├── 📂 frontend/              # React + Vite
│   ├── 📂 src/
│   │   ├── 📂 components/    # Reusable UI components
│   │   ├── 📂 pages/         # Page components
│   │   ├── 📂 services/      # API service layer
│   │   └── 📂 styles/        # CSS styles
│   ├── Dockerfile
│   └── nginx.conf            # Production web server config
│
├── 📂 docs/                  # Documentation
├── docker-compose.yml        # Container orchestration
├── .env.example              # Environment template
└── README.md                 # You are here!
```

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="96">
<b>Frontend</b>
</td>
<td align="center" width="96">
<b>Backend</b>
</td>
<td align="center" width="96">
<b>Database</b>
</td>
<td align="center" width="96">
<b>DevOps</b>
</td>
</tr>
<tr>
<td align="center">React 18</td>
<td align="center">Express.js</td>
<td align="center">SQLite</td>
<td align="center">Docker</td>
</tr>
<tr>
<td align="center">Vite</td>
<td align="center">Node.js 20</td>
<td align="center">better-sqlite3</td>
<td align="center">Nginx</td>
</tr>
<tr>
<td align="center">Tailwind CSS</td>
<td align="center">CORS</td>
<td align="center">-</td>
<td align="center">Docker Compose</td>
</tr>
<tr>
<td align="center">Lucide Icons</td>
<td align="center">-</td>
<td align="center">-</td>
<td align="center">-</td>
</tr>
</table>

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/students` | Get all students |
| `GET` | `/api/search?query=` | Search students |
| `GET` | `/api/student/{id}` | Get student with exams |
| `POST` | `/api/student` | Create new student |
| `POST` | `/api/student/{id}/exam` | Add exam to student |
| `DELETE` | `/api/student/{id}` | Delete student |
| `DELETE` | `/api/student/{id}/exam/{examId}` | Delete exam |

📖 See [Backend README](backend/README.md) for detailed API documentation.

---

## 🔧 Code Quality

### ESLint & Prettier
Code linting and formatting are configured for consistent code style.

```bash
# Run linting
cd frontend && npm run lint

# Auto-fix lint issues
cd frontend && npm run lint:fix

# Format code
cd frontend && npm run format
```

### Testing
Unit tests are set up with **Vitest** and **React Testing Library**.

```bash
# Run tests
cd frontend && npm run test

# Run tests in watch mode
cd frontend && npm run test:watch
```

### Error Handling
The API service (`frontend/src/services/api.js`) includes:
- ✅ Custom `ApiError` class for typed errors
- ✅ `safeFetch()` wrapper with try-catch
- ✅ Automatic URL encoding for safety
- ✅ Proper HTTP error status handling

### CI/CD Pipeline
GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push:

| Step | Description |
|------|-------------|
| **Lint** | ESLint checks for frontend & backend |
| **Test** | Vitest runs frontend tests |
| **Build** | Vite builds production bundle |
| **Docker** | Builds Docker images |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Soumik Biswas**

- GitHub: [@soumikk01](https://github.com/soumikk01)

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

⭐ **Star this repo if you found it helpful!** ⭐

Made with ❤️ by Soumik Biswas

</div>
