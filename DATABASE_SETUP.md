# Database Setup Guide

To make your data persist across devices, you need to set up a database. This guide will help you set up **Vercel Postgres** (recommended for Vercel deployments).

## Option 1: Vercel Postgres (Recommended)

### Step 1: Install Vercel Postgres

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to the "Storage" tab
4. Click "Create Database"
5. Select "Postgres"
6. Choose a name for your database (e.g., "finance-splitter-db")
7. Select a region closest to you
8. Click "Create"

### Step 2: Install Required Packages

```bash
npm install @vercel/postgres
```

### Step 3: Set Up Database Schema

The code will automatically create the necessary table. The database connection will use environment variables that Vercel automatically sets.

### Step 4: Deploy

Once you've added the database code and installed the package, redeploy your app. Vercel will automatically connect to your Postgres database.

## Option 2: Supabase (Alternative)

If you prefer using Supabase:

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Settings > API to get your connection string
4. Install: `npm install @supabase/supabase-js`
5. Add your connection string as an environment variable in Vercel

## Option 3: Vercel KV (Redis - Simple Option)

For a simpler key-value storage:

1. In Vercel dashboard, go to Storage
2. Create a KV database
3. Install: `npm install @vercel/kv`

---

**Note:** After setting up the database, the code will automatically use it. The localStorage will still work as a fallback if the database is unavailable.

