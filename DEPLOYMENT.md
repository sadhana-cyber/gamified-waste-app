# Deploying Gamified Waste Management to Render

This guide walks you through deploying the **Gamified Waste Management Application** to [Render](https://render.com) with a production-grade PostgreSQL database.

---

## Architecture Overview

The application is structured for easy, cost-effective deployment on Render:

```
                  +-----------------------------------+
                  |           Render.com              |
                  |                                   |
[ User Browser ] ---> [ Web Service (Node.js) ]       |
                  |     - Serves React Frontend (/)   |
                  |     - Serves REST API (/api/*)    |
                  |                   |               |
                  |                   v               |
                  |     [ Managed PostgreSQL DB ]     |
                  +-----------------------------------+
```

- **Single Web Service**: Express serves both the built React SPA (`/*`) and the REST API (`/api/*`), eliminating CORS issues and keeping hosting free/low-cost.
- **Automated Database Setup**: When the app boots on Render with a new PostgreSQL instance, it **automatically creates all tables, foreign keys, and indexes**, and seeds the **4 initial accounts** and system achievements.
- **Zero-Downtime Health Checks**: `/api/health` is configured for Render deployment verification.

---

## Method 1: 1-Click Blueprint Deployment (Recommended)

Render Blueprints use Infrastructure as Code (`render.yaml` included in this repository) to provision both the Web Service and PostgreSQL database automatically.

### Steps:
1. **Push your code to GitHub or GitLab**:
   ```bash
   git add .
   git commit -m "Configure database schema and Render deployment"
   git push origin main
   ```
2. Go to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** in the top navigation bar and select **Blueprint**.
4. Connect your GitHub/GitLab repository.
5. Render will automatically detect `render.yaml` and show:
   - **Database**: `gamified-waste-db` (PostgreSQL)
   - **Web Service**: `gamified-waste-app` (Node.js Web Service)
6. Click **Apply**.
7. Render will provision the database, build the React frontend and Express API, link `DATABASE_URL`, and launch your live application URL (e.g. `https://gamified-waste-app.onrender.com`).

---

## Method 2: Manual Dashboard Deployment

If you prefer to configure the services manually in the Render dashboard:

### Step 1: Create the PostgreSQL Database
1. In your Render Dashboard, click **New +** -> **PostgreSQL**.
2. Fill in the details:
   - **Name**: `gamified-waste-db`
   - **Database**: `gamified_waste`
   - **User**: `waste_admin`
   - **Region**: Choose the region closest to you (e.g. *Oregon (US West)* or *Frankfurt (EU)*).
   - **Plan**: *Free* (or *Starter*)
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** (or External Database URL if deploying across accounts).

### Step 2: Create the Web Service
1. Click **New +** -> **Web Service**.
2. Connect your repository.
3. Configure settings:
   - **Name**: `gamified-waste-app`
   - **Region**: Same region as your database.
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: *Free* (or *Starter*)
4. Expand **Advanced** and set the **Health Check Path** to `/api/health`.
5. Under **Environment Variables**, add:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production optimizations & SSL |
   | `DATABASE_URL` | `postgresql://...` | Paste your Render PostgreSQL URL from Step 1 |
   | `VITE_CLERK_PUBLISHABLE_KEY` | *(Optional)* | Your Clerk publishable key |
   | `CLERK_PUBLISHABLE_KEY` | *(Optional)* | Same Clerk publishable key |
   | `CLERK_SECRET_KEY` | *(Optional)* | Your Clerk secret key |
6. Click **Create Web Service**.

Render will now build both frontend and backend, connect to PostgreSQL, automatically initialize the schema and initial users, and give you your live URL!

---

## Database Schema Details

The application uses **Drizzle ORM** with **PostgreSQL**. The schema is located in `lib/db/src/schema/`:

### 1. `users` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` | Unique numeric user ID |
| `clerk_id` | `TEXT` | `UNIQUE` | Clerk auth identifier |
| `name` | `TEXT` | `NOT NULL` | Display name (sanitized) |
| `email` | `TEXT` | `NOT NULL, UNIQUE` | User email address |
| `total_points` | `INTEGER` | `NOT NULL, DEFAULT 0` | Gamification points score |
| `level` | `INTEGER` | `NOT NULL, DEFAULT 1` | User tier level |
| `streak` | `INTEGER` | `NOT NULL, DEFAULT 0` | Daily logging streak |
| `last_log_date` | `TEXT` | `NULLABLE` | Date of last logged waste entry (YYYY-MM-DD) |
| `auth_token` | `TEXT` | `UNIQUE` | Session token for Bearer auth |
| `created_at` | `TIMESTAMP`| `DEFAULT NOW()` | Account creation timestamp |

*Indexes:*
- `idx_users_clerk_id` on `clerk_id`
- `idx_users_email` on `email`
- `idx_users_total_points` on `total_points DESC` (optimized for leaderboards)
- `idx_users_auth_token` on `auth_token` (optimized for fast request authentication)

### 2. `waste_logs` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` | Unique log ID |
| `user_id` | `INTEGER` | `FOREIGN KEY (users.id) ON DELETE CASCADE` | Log author |
| `category` | `TEXT` | `NOT NULL` | recyclable, organic, hazardous, electronic, general |
| `weight_kg` | `REAL` | `NOT NULL` | Weight of waste in kg |
| `points_earned`| `INTEGER` | `NOT NULL, DEFAULT 0` | Points credited for this log |
| `notes` | `TEXT` | `NULLABLE` | Notes / description |
| `created_at` | `TIMESTAMP`| `DEFAULT NOW()` | Submission timestamp |

*Indexes:*
- `idx_waste_logs_user_id` on `user_id`
- `idx_waste_logs_created_at` on `created_at DESC`
- `idx_waste_logs_user_created` on `(user_id, created_at DESC)`
- `idx_waste_logs_category` on `category`

### 3. `achievements` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` | Unique achievement ID |
| `name` | `TEXT` | `NOT NULL, UNIQUE` | Badge title |
| `description` | `TEXT` | `NOT NULL` | Achievement requirement details |
| `icon` | `TEXT` | `NOT NULL` | Emoji badge icon |
| `points_required` | `INTEGER` | `NOT NULL` | Milestone threshold |
| `category` | `TEXT` | `NOT NULL` | starter, recycling, points, mastery |

### 4. `user_achievements` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` | Unique unlock ID |
| `user_id` | `INTEGER` | `FOREIGN KEY (users.id) ON DELETE CASCADE` | Unlocked user |
| `achievement_id` | `INTEGER` | `FOREIGN KEY (achievements.id) ON DELETE CASCADE` | Unlocked badge |
| `unlocked_at` | `TIMESTAMP`| `DEFAULT NOW()` | Date badge was unlocked |

*Constraints & Indexes:*
- `CONSTRAINT uniq_user_achievement UNIQUE (user_id, achievement_id)` (prevents duplicate badge awards)
- `idx_user_achievements_user` on `user_id`

---

## Local Database Commands

- **Initialize Database & Seed Initial 4 Users**:
  ```bash
  npm run db:init
  ```
- **Push Schema Changes to PostgreSQL with Drizzle**:
  ```bash
  npm run db:push
  ```

---

## Initial Seed Users

The application seeds 4 initial users on first run:
1. **Sadhana Selvakumar** (`sdhnselvakumar@gmail.com`)
2. **Alex Rivera** (`alex.rivera@ecocycle.org`)
3. **Maya Lin** (`maya.lin@ecocycle.org`)
4. **David Kim** (`david.kim@ecocycle.org`)

Any new users who sign in via Clerk or the registration flow are dynamically registered with ID `#5+` and saved to PostgreSQL in real time.
