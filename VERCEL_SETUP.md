# Complete Vercel Setup Guide

Follow these steps to deploy your Finance Splitter app to Vercel and set up cross-device data persistence.

## Step 1: Create a GitHub Repository

First, you need to push your code to GitHub:

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it (e.g., "finance-splitter")
   - Choose Public or Private
   - Don't initialize with README (you already have one)
   - Click "Create repository"

2. **Push your code to GitHub:**
   ```bash
   cd /Users/ebeakinfisoye/Finance
   git init
   git add .
   git commit -m "Initial commit: Finance Splitter app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/finance-splitter.git
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` with your GitHub username)

## Step 2: Deploy to Vercel

1. **Go to Vercel:**
   - Visit https://vercel.com
   - Click "Sign Up" (or "Log In" if you have an account)
   - Sign up with GitHub (recommended for easier integration)

2. **Import your project:**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Find your "finance-splitter" repository
   - Click "Import"

3. **Configure your project:**
   - Framework Preset: **Next.js** (should auto-detect)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)
   - Your app will be live at a URL like `finance-splitter.vercel.app`

## Step 3: Set Up Database (Vercel Postgres)

Now that your app is deployed, add the database:

1. **In your Vercel Dashboard:**
   - Click on your project
   - Go to the **"Storage"** tab
   - Click **"Create Database"**

2. **Select Postgres:**
   - Choose **"Postgres"** from the options
   - Name it: `finance-splitter-db` (or any name you prefer)
   - Select a region closest to you (e.g., `us-east-1` for US, `eu-west-1` for Europe)
   - Click **"Create"**

3. **Connect to your project:**
   - After creating, Vercel will automatically link it to your project
   - The environment variables will be automatically set
   - No manual configuration needed!

## Step 4: Redeploy

1. **Trigger a new deployment:**
   - Go to your project's "Deployments" tab
   - Click the "..." menu on the latest deployment
   - Click **"Redeploy"**
   - OR simply push a new commit to trigger automatic deployment:
     ```bash
     git add .
     git commit -m "Add database support"
     git push
     ```

## Step 5: Verify It Works

1. **Test your app:**
   - Open your Vercel URL
   - Add or update a bill
   - Check if data persists after refresh

2. **Test cross-device:**
   - Open the same URL on another device/browser
   - Your data should appear there too!

## Troubleshooting

### If database connection fails:
- Check that the database is created in the same Vercel team/account
- Verify the environment variables are set (Vercel does this automatically)
- Check the deployment logs in Vercel dashboard

### If build fails:
- Check the build logs in Vercel dashboard
- Make sure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Manual Environment Variables (if needed):
If for some reason Vercel doesn't auto-set the database variables, you can add them manually:
- Go to Project → Settings → Environment Variables
- The database connection string should be automatically available

## That's It!

Your app is now:
- ✅ Deployed on Vercel
- ✅ Connected to a Postgres database
- ✅ Syncing data across all devices
- ✅ Production-ready!

You can access it from any device using your Vercel URL, and all your bill data will be synchronized.

