# Firebase Authentication 運用チェックリスト

Google ログインのドメイン不一致・Popup/Redirect 失敗を防ぐため、リリース前に以下を確認してください。

## 1) Authorized domains を配信ドメイン分すべて登録
Firebase Console → Authentication → Settings → Authorized domains に、次を漏れなく追加します。

- 本番ドメイン（例: `app.example.com`）
- Preview ドメイン（例: Vercel/Netlify/Firebase Hosting の preview URL）
- カスタムドメイン（例: `learn.example.jp`）

## 2) Google Provider の有効化確認
Firebase Console → Authentication → Sign-in method で `Google` Provider が有効になっていることを確認します。

## 3) GCP OAuth 同意画面の公開状態を運用に合わせる
Google Cloud Console → APIs & Services → OAuth consent screen で、公開状態とテストユーザー制限を確認します。

- Internal / Testing の場合、許可ユーザー以外でログイン失敗する可能性あり
- Production 公開前に、ブランド情報・ドメイン・ポリシーURL などを整備

## 4) カスタム authDomain を使う場合は設定を一致
`services/firebase.ts` の `firebaseConfig.authDomain` と Firebase Hosting 側で実際に使う認証ドメインを一致させてください。

## 5) エラーログ送信（実装済み）
認証失敗時に下記を Firestore `client_error_logs` コレクションへ送信します。

- `errorCode`
- `errorMessage`
- `origin`
- `userAgent`
- `context`（`popup-login` / `redirect-login` / `redirect-result`）
- `path`
- `userId`
- `createdAt`

## 6) 実機検証マトリクス
下表を使って、Popup / Redirect の成功可否を記録してください。

| Device | Browser | Popup | Redirect | 備考 |
|---|---|---|---|---|
| iPhone (実機) | Safari | ☐ 成功 / ☐ 失敗 | ☐ 成功 / ☐ 失敗 | |
| Android (実機) | Chrome | ☐ 成功 / ☐ 失敗 | ☐ 成功 / ☐ 失敗 | |
| iPad (実機) | Safari | ☐ 成功 / ☐ 失敗 | ☐ 成功 / ☐ 失敗 | |
| Chromebook (実機) | Chrome | ☐ 成功 / ☐ 失敗 | ☐ 成功 / ☐ 失敗 | |

> 失敗時は `client_error_logs` の `origin` / `errorCode` / `userAgent` を突き合わせて原因を切り分けてください。
