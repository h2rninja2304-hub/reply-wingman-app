# Reply Wingman — standalone app (100% free version)

A texting reply assistant with 5 reply styles (pick-up line, flirty, bold,
casual, professional). This version needs no Claude login at all — it's a
plain static frontend (`index.html`) plus one small serverless backend
function (`api/generate.js`) that calls **Google's Gemini API on its free
tier**, so there's no cost at any step.

## What you need (all free, no credit card)

1. A free Gemini API key — go to https://aistudio.google.com, sign in with
   any Google account, click "Get API key" → "Create API key". No billing
   setup required for the free tier.
2. A free Vercel account — https://vercel.com (sign in with GitHub is easiest).
3. A free GitHub account, to hold the code Vercel deploys from.

That's it — no paid plan anywhere in this chain as long as you stay on the
free tier's rate limits (fine for one person using it).

## Deploy in 5 minutes (no command line needed)

1. Create a new GitHub repository and upload these files to it, keeping the
   folder structure: `index.html`, the `api/` folder (with `generate.js`
   inside), and `package.json`.
2. Go to https://vercel.com/new, click "Import" next to that repository,
   and click **Deploy**. Leave all settings as default — Vercel auto-detects
   the `api/` folder as a serverless function and serves `index.html` as
   your homepage.
3. Once deployed, go to your new project → **Settings → Environment
   Variables**, add:
   - Name: `GEMINI_API_KEY`
   - Value: (paste the key from aistudio.google.com)
4. Go to **Deployments**, click the ⋯ menu on the latest deployment, and
   choose **Redeploy** so it picks up the new environment variable.
5. Open the URL Vercel gives you (e.g. `reply-wingman.vercel.app`) — it's
   live and works from any device, no login to anything required to use it.

## Prefer the command line?

```bash
npm i -g vercel
cd reply-wingman-app
vercel                              # first deploy, follow the prompts
vercel env add GEMINI_API_KEY production
vercel --prod                       # redeploy with the key set
```

## Notes

- Nobody else can find or use your deployed site unless you give them the
  URL — it isn't listed anywhere.
- The free Gemini tier is rate-limited (fine for occasional personal use,
  not built for heavy or public traffic) and Google may use free-tier
  traffic to improve their products — don't paste anything sensitive.
- If Google ever renames or retires the `gemini-2.5-flash-lite` model,
  open `api/generate.js` and change the `MODEL` constant at the top to
  whatever free model is current at https://ai.google.dev/gemini-api/docs/rate-limits.
- Netlify and Cloudflare Pages work too, with the same free-tier logic —
  ask if you'd like a version adapted for either.
