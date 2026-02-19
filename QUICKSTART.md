# 🚀 Quick Start Guide - EV Route Planner

Get up and running in 5 minutes!

## ⚡ Prerequisites

- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] Supabase account (free: https://supabase.com)

## 📝 Step-by-Step Setup

### 1️⃣ Get Supabase Credentials (2 minutes)

1. Go to https://supabase.com and sign up
2. Click "New Project"
3. Fill in project details and create
4. Once ready, go to **Settings → API**
5. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### 2️⃣ Setup Database (1 minute)

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Open `backend/database_schema.sql` from this project
4. Copy ALL the contents
5. Paste into Supabase SQL Editor
6. Click **RUN** button
7. ✅ You should see "Success. No rows returned"

### 3️⃣ Configure Backend (30 seconds)

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file and paste your Supabase credentials:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...your-anon-key-here
```

### 4️⃣ Install & Run Backend (1 minute)

```bash
# Still in backend/ folder
pip install -r requirements.txt
uvicorn main:app --reload
```

✅ You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Keep this terminal running!

### 5️⃣ Install & Run Frontend (1 minute)

Open a NEW terminal:

```bash
cd frontend
npm install
npm run dev
```

✅ You should see:
```
  VITE ready in 500 ms
  ➜  Local:   http://localhost:5173/
```

### 6️⃣ Open the App! 🎉

Open your browser and go to: **http://localhost:5173**

## ✨ First Test

1. Click **"Get Started"**
2. Select **"Tata Motors"**
3. Select **"Nexon EV"**
4. You're now on the route planner!

## 🐛 Troubleshooting

### Backend won't start?
```bash
# Check Python version
python --version  # Must be 3.11+

# If wrong version, install Python 3.11+
# Then: pip install -r requirements.txt
```

### Frontend shows "Backend Not Connected"?
- Make sure backend is running (Step 4)
- Check if you see backend running at http://localhost:8000
- Visit http://localhost:8000 in browser - you should see JSON response

### Database errors?
- Double-check you ran the SQL schema (Step 2)
- Verify credentials in `.env` are correct
- Try re-running the SQL schema in Supabase

## 📚 Next Steps

- [Full Documentation](./README.md)
- [Backend Guide](./backend/README.md)
- [Frontend Guide](./frontend/README.md)

## 🎯 What Can You Do Now?

✅ Select different EV models  
✅ Plan routes on the map  
✅ See battery range calculations  
✅ View charging stop recommendations  
✅ Install as PWA on your phone  

## 💡 Tips

1. **Current Location**: Click "Use Current Location" in route planner
2. **Map Clicks**: Click on map to set start/end points
3. **Battery Slider**: Adjust to see how range changes
4. **PWA Install**: On mobile, add to home screen for app-like experience

## 🆘 Still Having Issues?

1. Check the full README.md
2. Open an issue on GitHub
3. Check all terminals for error messages

---

**Happy routing! 🚗⚡**
