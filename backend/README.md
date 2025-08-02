# PFM Backend - Personal Finance Manager API

Intelligent NLP-powered expense tracking backend with smart categorization.

## Features

- 🧠 **Smart NLP Parser** - Understands natural language like "payed 5000 for hotel stay"
- 🏷️ **Auto-Categorization** - Intelligently creates categories (Travel, Medical, Education, etc.)
- 💰 **Debt Tracking** - Handles "X owes Y to Z" patterns
- 🔄 **Flexible Input** - Supports typos and variations ("payed" vs "paid")

## Quick Deploy to Railway

1. **Connect to Railway:**
   ```bash
   railway login
   railway link
   ```

2. **Set Environment Variables:**
   ```bash
   railway variables set GEMINI_API_KEY=your_key_here
   ```

3. **Deploy:**
   ```bash
   railway up
   ```

## Environment Variables

- `GEMINI_API_KEY` - Google Gemini API key for enhanced parsing
- `PORT` - Server port (default: 8000)

## API Endpoints

- `POST /parse` - Parse expense text
- `POST /chat` - Chat about expenses
- `GET /health` - Health check

## Example Usage

```bash
curl -X POST "https://your-app.railway.app/parse" \
  -H "Content-Type: application/json" \
  -d '{"text": "payed 5000 for hotel stay"}'
```

Response:
```json
{
  "expenses": [{
    "amount": 5000,
    "item": "hotel stay",
    "category": "Travel",
    "remarks": "Hotel Stay"
  }],
  "reply": "SUCCESS: Added Rs.5000 -> Travel (Hotel Stay)"
}
```