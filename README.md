<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1kTaFi4vJBV-7774fyx8Z4mgcYg2iUf2B

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Firestore production rules

This repository includes a production-safe Firestore rules file at `firestore.rules`.

### Deploy rules

1. Install Firebase CLI (once):
   `npm i -D firebase-tools`
2. Login (if needed):
   `npx firebase login --no-localhost`
3. Select your project:
   `npx firebase use <your-firebase-project-id>`
4. Deploy rules:
   `npx firebase deploy --only firestore:rules`

### Rule intent

- Signed-in users can only create/read/update/delete documents where `userId === request.auth.uid`.
- Collections covered: `words`, `books`, `notes`.
- All other collections are denied by default.

## Firebase Auth operations checklist

- See `docs/firebase-auth-operations.md` for pre-release checks (authorized domains, Google provider, OAuth consent screen, authDomain alignment), client error logging, and a real-device Popup/Redirect validation matrix.
