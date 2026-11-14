# デプロイ手順（APIキー秘匿化対応）

この変更で、Gemini API の呼び出しをブラウザ直叩き（`VITE_API_KEY`）から
Firebase Functions 経由に移し、API キーをサーバー側の Secret Manager に
閉じ込めます。デプロイは以下の順番で行ってください。

## ⚠️ 破壊的変更

- **AI 機能（単語検索 / AIクイズ / AIチャット / ノート生成 / 英検採点）は
  ログイン必須になります。** Functions 側で Firebase ID トークンを検証し、
  未ログインのリクエストは 401 を返します。
- 未ログインで AI 機能を使うと「ログインが必要です」というエラーが表示されます。
  単語の保存など従来からログイン必須だった機能に変更はありません。

## 1. サーバー用シークレットの設定

```bash
firebase functions:secrets:set GEMINI_API_KEY
# プロンプトで「新しいサーバー専用キー」を入力する（後述のキーローテーション参照）
```

※ `evaluateEikenSpeaking` は移行前から同じシークレット名を使っています。
既に設定済みの場合も、キーローテーションに合わせて新しいキーで上書きしてください。

## 2. Functions のデプロイ

```bash
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions
```

今回 `firebase.json` に `functions` セクション（source: functions /
runtime: nodejs20）を追加したため、`--only functions` が使えるようになります。
デプロイされる関数: `lookupWord` / `generateAiQuiz` / `chatWithTutor` /
`generateNote` / `evaluateEikenSpeaking`（認証必須化）。

## 3. Hosting のデプロイ

```bash
npm run build
firebase deploy --only hosting
```

デプロイ前に、Hosting の環境変数・`.env` 系ファイルから
**`VITE_API_KEY` を削除**してください（残っていると古いキーがバンドルに
含まれ続けます）。

## 4. キーローテーション チェックリスト

ブラウザに露出していた旧キーは「漏洩済み」として扱い、必ず入れ替えます。

- [ ] Google AI Studio / Google Cloud で**新しい Gemini API キーを作成**する
  - 用途制限: Generative Language API のみに制限する
  - サーバーから使うため、ウェブサイト（リファラ）制限は付けない
    （付けると Functions から呼べなくなる）
- [ ] 新しいキーを `firebase functions:secrets:set GEMINI_API_KEY` に設定する
- [ ] Functions と Hosting をデプロイし、ログイン状態で AI 機能が動くことを確認する
- [ ] **旧キーを無効化・削除する**（ここまで終わる前に消すと現行サイトが止まるので順番厳守）
- [ ] リポジトリと履歴にキーが残っていないか確認する
      （`grep -r "AIza" --exclude-dir=node_modules .` など。
      ※ `services/firebase.ts` の Firebase 用 apiKey は公開前提の識別子なので対象外）

## 5. フォローアップ（今回は対象外）

- **App Check / レート制限**: 現状は「ログイン済みユーザーは誰でも呼べる」
  状態です。公開規模が大きくなる場合は App Check の導入と、
  ユーザー単位のレート制限（Firestore カウンタ等）を検討してください。
  ログイン必須化により、悪用時はアカウント単位で追跡・停止は可能です。
- **SRS の ease factor**: コメント（Grade 0 で -0.8）と実装（-0.2）の
  不一致が `services/srsService.ts` にありますが、今回の対応範囲外です。
