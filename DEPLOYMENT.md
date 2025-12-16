# Deployment Guide for XPOZ

This project is set up to be deployed with **Render (Backend)** and **Vercel (Frontend)**.

## 1. Deploy the Backend (Render)

1.  Sign up/Login to [Render](https://render.com/).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository (`Lupah-T/XPOZ`).
4.  Configure the service:
    *   **Name**: `xpoz-server` (or similar)
    *   **Root Directory**: `server`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
5.  **Environment Variables**:
    Scroll down to "Environment Variables" and add:
    *   `MONGO_URI`: Your MongoDB connection string (e.g., from MongoDB Atlas).
    *   `JWT_SECRET`: A strong secret key for authentication.
    *   `PORT`: `5000` (Render might override this, which is fine as the code uses `process.env.PORT`).
6.  Click **Create Web Service**.
7.  Wait for deployment to finish. **Copy the backend URL** (e.g., `https://xpoz-server.onrender.com`).

## 2. Deploy the Frontend (Vercel)

1.  Sign up/Login to [Vercel](https://vercel.com/).
2.  Click **Add New...** -> **Project**.
3.  Import the `XPOZ` repository.
4.  Configure the project:
    *   **Root Directory**: Click "Edit" and select `client`.
    *   **Framework Preset**: Select **Vite** (it should auto-detect).
    *   **Build Command**: `npm run build` (default).
    *   **Output Directory**: `dist` (default).
5.  **Environment Variables**:
    Expand the "Environment Variables" section and add:
    *   `VITE_API_URL`: Paste the **Render Backend URL** from step 1 (e.g., `https://xpoz-server.onrender.com`).
    *   *Note: Do not add a trailing slash.*
6.  Click **Deploy**.

## 3. Final Checks

*   Open your Vercel deployment URL.
*   Try Logging in or Registering to verify the connection to the backend.
*   Check the browser console if there are any connection errors (CORS issues, etc.).
*   *Note on CORS*: The server is currently configured to allow all origins (`cors()`). For stricter security in the future, you can configure it to only allow your Vercel domain.
