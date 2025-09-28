# KMRL Deployment Guide

This guide will help you deploy the KMRL project to Netlify (frontend) and Render (backend) using your private GitHub repository.

## 🚀 Prerequisites

- Private GitHub repository with your KMRL project
- Netlify account (free tier available)
- Render account (free tier available)
- MongoDB Atlas account (for database)

## 📋 Step-by-Step Deployment

### 1. Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

2. **Set up MongoDB Atlas**:
   - Create a MongoDB Atlas account
   - Create a new cluster
   - Create a database user
   - Whitelist all IP addresses (0.0.0.0/0) for now
   - Get your connection string

### 2. Deploy Backend to Render

1. **Go to [Render Dashboard](https://dashboard.render.com/)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**:
   - Select your private repository
   - Choose the `backend` folder as the root directory
4. **Configure the service**:
   - **Name**: `kmrl-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
5. **Set Environment Variables**:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A strong secret key (generate one)
   - `CORS_ORIGIN`: `https://your-netlify-app.netlify.app` (update after frontend deployment)
   - `PORT`: `3001` (Render will override this)
6. **Click "Create Web Service"**
7. **Wait for deployment** (5-10 minutes)
8. **Note your backend URL** (e.g., `https://kmrl-backend.onrender.com`)

### 3. Deploy Frontend to Netlify

1. **Go to [Netlify Dashboard](https://app.netlify.com/)**
2. **Click "New site from Git"**
3. **Connect your GitHub repository**:
   - Select your private repository
   - Choose the `frontend` folder as the base directory
4. **Configure build settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `18`
5. **Set Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g., `https://kmrl-backend.onrender.com`)
   - `NODE_ENV`: `production`
6. **Click "Deploy site"**
7. **Wait for deployment** (3-5 minutes)
8. **Note your frontend URL** (e.g., `https://amazing-app-123456.netlify.app`)

### 4. Update CORS Configuration

1. **Go back to Render dashboard**
2. **Find your backend service**
3. **Go to Environment tab**
4. **Update `CORS_ORIGIN`** to your Netlify URL
5. **Redeploy the service**

### 5. Test Your Deployment

1. **Visit your Netlify URL** to see the frontend
2. **Test the API** by visiting `https://your-backend-url.onrender.com/health`
3. **Check browser console** for any CORS errors
4. **Test login/registration** functionality

## 🔧 Environment Variables Reference

### Backend (Render)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kmrl-fleet
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=https://your-netlify-app.netlify.app
PORT=3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Frontend (Netlify)
```
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
NODE_ENV=production
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure `CORS_ORIGIN` in backend matches your Netlify URL exactly
   - Check that the frontend is making requests to the correct backend URL

2. **Build Failures**:
   - Check the build logs in Netlify/Render
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation

3. **Database Connection Issues**:
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has proper permissions

4. **Environment Variables**:
   - Double-check all environment variables are set correctly
   - Restart services after changing environment variables

### Logs and Monitoring

- **Render**: Check logs in the Render dashboard
- **Netlify**: Check build logs in the Netlify dashboard
- **MongoDB Atlas**: Monitor connection metrics

## 🔄 Updating Your Deployment

1. **Push changes to GitHub**
2. **Netlify will automatically redeploy** the frontend
3. **Render will automatically redeploy** the backend
4. **Test the changes** on your live URLs

## 💰 Cost Considerations

- **Netlify Free Tier**: 100GB bandwidth, 300 build minutes/month
- **Render Free Tier**: 750 hours/month, sleeps after 15 minutes of inactivity
- **MongoDB Atlas Free Tier**: 512MB storage, shared clusters

## 🔒 Security Considerations

1. **Use strong JWT secrets**
2. **Set up proper CORS origins**
3. **Use environment variables for sensitive data**
4. **Consider upgrading to paid tiers for production**

## 📞 Support

If you encounter issues:
1. Check the logs in both Netlify and Render dashboards
2. Verify all environment variables are set correctly
3. Test the API endpoints directly
4. Check MongoDB Atlas connection

---

**Happy Deploying! 🚀**

