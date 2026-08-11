<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8228476c-ee8f-4d46-944f-e244576318f2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Local backend setup (optional)

If you want to run the Express backend locally for development and have the frontend proxy to it:

1. Copy `.env.server.sample` to `.env.server` and fill in values (DO NOT commit `.env.server`).

2. Start the backend from the project root:
```bash
npm run server
```

3. Verify the backend is running:
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/courses
```

4. For frontend dev, you can use the provided `.env.sample` to set `VITE_API_URL` to `http://localhost:5000`, or rely on `vite.config.ts` which falls back to the deployed backend.

Notes:
- Keep `SUPABASE_SERVICE_ROLE_KEY` and other secrets out of the repository; use Render secrets for production.
- If you use Supabase OAuth locally, add `http://localhost:5173` to your Supabase project's redirect/allowed origins.

