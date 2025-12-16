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

## 4. Troubleshooting

### Blank Page or White Screen

If you see a blank page after deployment:

1. **Open Browser Console** (F12 or Right-click → Inspect → Console)
   - Look for JavaScript errors (red text)
   - Look for network errors (failed API calls)
   - Check the console logs that start with `[Config]` and `[AuthContext]`

2. **Check Environment Variables**
   - In Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify `VITE_API_URL` is set to your Render backend URL
   - **Important**: After adding/changing environment variables, you must **redeploy** the project
   - Go to Deployments → Click ⋯ on latest deployment → Redeploy

3. **Common Issues:**
   - **API_URL not set**: Console will show `[Config] Using API_URL: http://localhost:5000`
     - Fix: Add `VITE_API_URL` environment variable in Vercel
   - **CORS errors**: Console shows "blocked by CORS policy"
     - Fix: Backend should already allow all origins, but check Render logs
   - **Backend not responding**: Console shows network errors or timeouts
     - Fix: Check Render dashboard to ensure backend is running
     - Visit backend URL directly (e.g., `https://xpoz-server.onrender.com`) - should show "Anonymous Reporting API is running"

### Admin Page Issues

If the admin page is blank but other pages work:

1. **Check if you're logged in as admin**
   - Only users with `role: 'admin'` can access `/admin/dashboard`
   - Console will show `[AuthContext] User data fetched successfully: <username>`
   
2. **Create an admin user** (if none exists):
   ```bash
   # In your server directory locally
   node create_admin.js
   ```

3. **Check API connectivity**
   - Console logs starting with `[AdminDashboard]` will show API call status
   - Network tab should show requests to `/api/admin/stats`, `/api/admin/users`, etc.

### Still Having Issues?

- Check Render logs for backend errors
- Ensure MongoDB connection is working (check `MONGO_URI` in Render)
- Try accessing the API directly: `https://your-backend.onrender.com/api/auth/me` (with auth token)
- Clear browser cache and localStorage, then try again
