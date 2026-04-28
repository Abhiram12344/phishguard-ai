# PhishGuard AI — Static Landing Page

This folder contains a **standalone `index.html`** safe to deploy to GitHub Pages.
It is intentionally separate from the main TanStack Start app (which lives in `src/`)
because GitHub Pages cannot run server functions, the database, or the AI scanner.

## Deploy to GitHub Pages

1. Push this repo to GitHub (Lovable → Connectors → GitHub).
2. In your repo: **Settings → Pages**.
3. Source: **Deploy from a branch** → branch `main` → folder `/landing`.
4. Save. Your landing page will be live at
   `https://<your-username>.github.io/<repo>/`.

## Linking to the real app

Open `landing/index.html` and update the `APP_URL` constant near the bottom
to point at your published Lovable URL (click **Publish** in Lovable to get one).

The full PhishGuard AI app — scanner, dashboard, AI verdicts, database —
must continue to run on Lovable, not GitHub Pages.
