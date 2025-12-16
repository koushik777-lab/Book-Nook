# KitabGhar – E-Book Management System

KitabGhar is a comprehensive E-Book Management System designed to provide a centralized and interactive platform for managing and reading e-books. It offers a seamless experience for both users and administrators, combining a robust library management backend with a modern, responsive frontend.

## Features

### 📚 Book Management
- **Centralized Library**: Browse a vast collection of e-books organized by categories.
- **Search & Filter**: Quickly find books by title, author, or category.
- **File Support**: Support for various e-book formats including PDF.

### 👤 User Authentication & Roles
- **Secure Login/Register**: User account creation and authentication.
- **Role-Based Access**: Specialized features for Administrators and standard Users.
- **Profile Management**: Manage personal details and preferences.

### 📖 Interactive Reading Experience
- **Progress Tracking**: Automatically saves your reading progress so you can pick up where you left off.
- **Bookmarks**: Save important pages for quick reference.
- **Online Reader**: Built-in e-book reader for instant access without downloads.

### 🌟 User Engagement
- **Ratings & Reviews**: Share your thoughts and see what others are saying about books.
- **Downloads**: Download books for offline reading (where permitted).

## Technology Stack

This project is built using a modern full-stack architecture:

### Frontend
- **Framework**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [TanStack Query (React Query)](https://tanstack.com/query/latest)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Validation**: [Zod](https://zod.dev/)
- **File Handling**: [Multer](https://github.com/expressjs/multer)

### Database
- **Database**: [MongoDB](https://www.mongodb.com/)
- **ODM**: [Mongoose](https://mongoosejs.com/)

## Benefits

- **Efficiency**: Streamlines the process of cataloging and retrieving e-books.
- **Accessibility**: Access your library from any device with a modern web browser.
- **Scalability**: Built on a robust stack that can grow with your library.
- **User-Centric**: Designed with a focus on experience, readability, and engagement.

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (running instance or Atlas URI)

### Installation

1.  **Clone the repository** (if applicable) or navigate to the project directory.

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Ensure you have a MongoDB instance running. The application connects to the database specified in your environment or default configurations.

### Running the Application

To start the development server (runs both backend and frontend):

```bash
npm run dev
```

The application will be available at `http://localhost:5001` (or your configured PORT).

### Building for Production

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```