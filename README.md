# AccessFix AI

Hackathon MVP for hearing and fixing web accessibility barriers.

## Run The Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. To scrape a live page, start the backend too, choose `Enter URL`, paste a URL, and analyze. The backend fetches one HTML page and returns the markup to the frontend for issue display and screen-reader simulation.

## Run The Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend provides `/api/analyze` for URL scraping and BeautifulSoup accessibility checks, plus `/api/fix` for model-powered suggestions. It tries OpenAI first, then optional local Ollama, then local deterministic fixes.

## Enable Real AI Fixes

Create `backend/.env`:

```bash
OPENAI_API_KEY=sk-your-key-here
```

Restart the backend after adding the key. The frontend `Fix with AI` button calls `/api/fix` once per detected issue. If the key is missing, out of quota, or the API call fails, the app can use Ollama or reviewable local fixes so the presentation still works.

## Optional Local AI With Ollama

Install Ollama and run a local model:

```bash
ollama run llama3.2
```

Optional `backend/.env` settings:

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

The `/api/fix` provider order is OpenAI, Ollama, then local accessibility repair rules.

## Hackathon Readiness

See `HACKATHON_CHECKLIST.md` for the objective and tech-stack checklist.

## Demo Script

1. Start both frontend and backend.
2. Enter a real URL or load the backup demo.
3. Show the score and issue list generated from fetched HTML.
4. Play the before simulation.
5. Apply fixes and show the flagged AI suggestions.
6. Play the after simulation and compare the improved score.
