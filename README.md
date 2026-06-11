## Setup

### 1. Backend
```bash
cd backend
pip install -r requirements.txt

# Build the search index (run once, or after documents change)
# Set paths in backend/config.py first
python scripts/build_index.py

# Start the API server
uvicorn backend.main:app --reload

# Frontend
cd frontend
npm install
npm run dev


Open http://localhost:5173
