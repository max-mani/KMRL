@echo off
echo 🚀 Setting up KMRL for deployment...

REM Check if git is initialized
if not exist ".git" (
    echo 📦 Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit with deployment configuration"
)

REM Check if remote origin exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo ⚠️  No remote origin found. Please add your GitHub repository:
    echo    git remote add origin https://github.com/yourusername/your-repo.git
    echo    git push -u origin main
)

echo ✅ Deployment configuration files created:
echo    📁 frontend/netlify.toml - Netlify configuration
echo    📁 backend/render.yaml - Render configuration
echo    📁 backend/Dockerfile - Docker configuration (alternative)
echo    📁 DEPLOYMENT.md - Complete deployment guide
echo    📁 .gitignore - Git ignore file

echo.
echo 🔧 Next steps:
echo 1. Set up MongoDB Atlas database
echo 2. Push your code to GitHub
echo 3. Deploy backend to Render
echo 4. Deploy frontend to Netlify
echo 5. Update CORS settings
echo.
echo 📖 See DEPLOYMENT.md for detailed instructions

pause

