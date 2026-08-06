<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Smart Toolkit

Vite + React based calculator toolkit.

## Run Locally

Prerequisites: Node.js 20+

1. Install dependencies:
   `npm install`
2. (Optional) Set `GEMINI_API_KEY` in `.env.local` if you use Gemini features.
3. Start dev server:
   `npm run dev`

## Build

1. Create production build:
   `npm run build`
2. Output directory:
   `dist`

## Deploy To Cloudflare Pages

Use the deployment script below. It is hard-locked to the Cloudflare Pages project `smarttoolkit`.

1. Build and deploy in one command:
   `npm run deploy`
2. Production domain:
   `https://smarttoolkit.pages.dev/`

Use these exact settings in Cloudflare Pages project configuration:

1. Framework preset: `Vite`
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Root directory: `/`

Important: Do not deploy project root files directly. Deploy built assets from `dist`.

## Blank Screen Troubleshooting (Cloudflare)

If the page is blank and browser console shows module MIME errors, the site is likely serving source `index.html` with this script:

`<script type="module" src="/src/main.tsx"></script>`

That means build output is not being served. Recheck Cloudflare Pages settings above and redeploy.
