# Cloudflare Cache Purge Guide (smarttoolkit)

Target project: smarttoolkit  
Production domain: https://smarttoolkit.pages.dev/

## 1) Deploy latest build first

Run this in repo root:

```powershell
npm run deploy
```

This repository is locked to deploy only to the smarttoolkit Pages project.

## 2) Purge cache from Cloudflare Dashboard

1. Open Cloudflare Dashboard.
2. Go to Workers & Pages > smarttoolkit > Deployments.
3. Confirm latest deployment is Production/main and latest commit.
4. Go to Caching > Cache Rules / Purge Cache.
5. Choose one of the following:
   - Purge everything (strongest, immediate)
   - Custom purge URL (faster):
     - https://smarttoolkit.pages.dev/
     - https://smarttoolkit.pages.dev/index.html
6. Purge and wait 30-90 seconds.

## 3) Browser-side hard refresh (required)

1. Open https://smarttoolkit.pages.dev/
2. Press Ctrl+Shift+R (or Ctrl+F5)
3. Re-test in InPrivate window

## 4) Verify that latest assets are served

In browser DevTools > Network:

1. Check index.html is not stale.
2. Check JS/CSS file names are latest hashed assets.
3. Check status code is 200 and content updates match latest commit.

## 5) Fast terminal verification

```powershell
cmd /c npx wrangler pages deployment list --project-name smarttoolkit
```

Expected: top row shows Environment=Production, Branch=main, Source=latest commit.
