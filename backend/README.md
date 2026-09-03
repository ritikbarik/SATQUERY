# SatQuery AI Backend

FastAPI service for deterministic SatQuery AI analysis responses.

## Run

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/api/health
```

Query:

```bash
curl -X POST http://127.0.0.1:8000/api/query -H "Content-Type: application/json" -d "{\"question\":\"Show vegetation loss between 2024 and 2026\",\"location\":\"Odisha, India\"}"
```
