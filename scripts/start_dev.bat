@echo off
echo ===================================================
echo Starting Smart Income Buffer Fullstack Environment
echo ===================================================

echo [1/2] Initializing database and running seeds...
python apps\api\app\db\seed.py

echo [2/2] Starting backend on http://127.0.0.1:8000 and frontend on http://localhost:3000...
start cmd /k "cd apps\api && uvicorn app.main:app --reload --port 8000"
start cmd /k "cd apps\web && npm run dev"

echo Both services launched in separate terminal windows!
echo FastAPI Swagger Docs: http://127.0.0.1:8000/docs
echo Next.js Web Client:  http://localhost:3000
pause
