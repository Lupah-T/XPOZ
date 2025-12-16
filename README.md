# XPOZ - Anonymous Reporting Platform

XPOZ is a full-stack web application designed for anonymous reporting and community engagement. Built with the MERN stack (MongoDB, Express, React, Node.js), it allows users to create reports, join groups, and interact within a secure environment. It also features a comprehensive admin dashboard for managing users and content.

## Features

*   **User Authentication**: Secure signup and login functionality using JWT.
*   **Anonymous Reporting**: Users can create posts and reports securely.
*   **Group Management**: Join and participate in various community groups.
*   **Data Visualization**: Admin dashboard with statistics on users, reports, and groups.
*   **Admin Controls**:
    *   Manage users (freeze/activate accounts).
    *   Delete inappropriate reports/users.
    *   Secure admin account creation.
*   **Responsive Design**: Modern frontend built with React and Vite.

## Tech Stack

### Frontend
*   **React** (v19)
*   **Vite** (Build tool & Dev server)
*   **React Router DOM** (Navigation)
*   **ESLint** (Code quality)

### Backend
*   **Node.js** & **Express**
*   **MongoDB** & **Mongoose** (Database)
*   **JWT** (Authentication)
*   **Bcryptjs** (Password hashing)
*   **Multer** (File uploads)
*   **Dotenv** (Environment variables)

## Prerequisites

*   Node.js (v14+ recommended)
*   npm or yarn
*   MongoDB (Local instance or Atlas URI)

## Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Lupah-T/XPOZ.git
    cd XPOZ
    ```

2.  **Install Dependencies**

    *   **Server**:
        ```bash
        cd server
        npm install
        ```

    *   **Client**:
        ```bash
        cd client
        npm install
        ```

3.  **Configuration**

    Create a `.env` file in the `server` directory with the following variables:
    ```env
    MONGO_URI=mongodb://localhost:27017/anonymous_reporting
    JWT_SECRET=your_jwt_secret_key
    PORT=5000
    ```

4.  **Database Setup (Admin User)**

    To create an initial admin account, run the interactive script in the server directory:
    ```bash
    cd server
    node create_admin.js
    ```
    Follow the prompts to set a secure password for the `AdminUser`.

## Running the Application

### Development Mode

1.  **Start the Server**:
    ```bash
    # In the server directory
    npm run dev
    ```
    Server will start on `http://localhost:5000`.

2.  **Start the Client**:
    ```bash
    # In the client directory
    npm run dev
    ```
    Client will start on `http://localhost:5173` (default Vite port).

## API Endpoints Overview

*   **Auth**: `/api/auth/register`, `/api/auth/login`
*   **Reports**: `/api/reports` (GET, POST, DELETE)
*   **Groups**: `/api/groups`
*   **Admin**:
    *   `/api/admin/stats` (Dashboard stats)
    *   `/api/admin/users` (List users)
    *   `/api/admin/users/:id/freeze` (Freeze user)
    *   `/api/admin/users/:id` (Delete user)

## License

This project is licensed under the ISC License.
