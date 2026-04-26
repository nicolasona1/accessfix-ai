# AccessFix AI Hackathon Checklist

## Objective Status

- [x] Accept pasted HTML
- [x] Accept a URL and scrape one page through the FastAPI backend
- [x] Detect core accessibility issues with BeautifulSoup/client parser
- [x] Score the page from 0-100 with capped penalties for real websites
- [x] Simulate screen reader output with the browser Web Speech API
- [x] Show before and after screen-reader scripts
- [x] Generate fixed HTML preview
- [x] Wire `Fix with AI` to the backend `/api/fix` route
- [x] Keep AI-generated/reviewable image descriptions marked with `data-ai-suggested`
- [x] Try OpenAI, optionally try local Ollama, then fall back gracefully to local fixes
- [x] Provide a clean single-page demo layout

## Tech Stack Status

- [x] React
- [x] Vite
- [x] Framer Motion
- [x] Web Speech API
- [x] FastAPI
- [x] BeautifulSoup4
- [x] Requests
- [x] CORS middleware
- [x] OpenAI API integration path
- [ ] Tailwind CSS
- [ ] shadcn/ui
- [ ] Hosted Vercel frontend
- [ ] Hosted Render/Railway backend

## Demo Notes

- Use a known bad page or the built-in demo if live scraping is slow.
- If model access is unavailable, say: "The AI route is wired through the backend, and this demo is using reviewable local fixes because model services are unavailable."
- The strongest moment is still the before/after audio comparison.
