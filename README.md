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

## Feedback機能の表示条件

Feedback機能（`FeedbackModal`）を有効な状態として扱うために、以下を満たすこと。

- `App.tsx` に `FeedbackModal` がマウントされていること。
- 少なくとも1つ以上の常時到達可能なUI導線（例: 主要画面から常時アクセスできるボタンやメニュー）があること。
- `showFeedback` が `true` になった時にモーダルが表示されること（`FeedbackModal` の `isOpen` に `showFeedback` が渡されていること）。

### 導線追加時の確認チェックリスト

Feedback導線を追加・変更した場合、以下を確認すること。

- [ ] 検索画面: 画面表示直後から導線が視認・操作でき、モーダル起動まで到達できる。
- [ ] 一覧画面: 一覧のスクロールやフィルタ状態に依存せず、導線が実質的に到達可能である。
- [ ] 設定画面: 既存設定操作を阻害せず、導線からモーダル表示・クローズが正常動作する。
- [ ] クイズ画面: 出題中/回答後など主要状態でも導線が意図どおり機能し、学習フローを壊さない。
