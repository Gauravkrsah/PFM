# 🧾 Minimalist PFM - Personal Finance Manager

A lightweight, collaborative, NLP-powered personal finance manager with natural chat input and spreadsheet-style controls.

## 🚀 Quick Start

### Frontend (React)
```bash
npm install
npm start
```

### Backend (Python)
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Database Setup
1. Create a Supabase project
2. Run the SQL schema from `supabase_schema.sql`
3. Update `src/supabase.js` with your Supabase URL and key

## 💬 Usage

1. **Chat Input**: Type natural language like "500 on biryani, 400 on grocery"
2. **Table View**: Edit expenses in spreadsheet format
3. **Analytics**: View spending insights and trends

## 🧩 Features

- ✅ Natural language expense input
- ✅ Real-time expense tracking
- ✅ Category auto-detection
- ✅ Visual analytics
- ✅ Minimalist UI design
- 🔄 Group collaboration (coming soon)

## 🛠️ Tech Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: Python FastAPI
- **Database**: Supabase (PostgreSQL)
- **NLP**: Custom regex-based parser