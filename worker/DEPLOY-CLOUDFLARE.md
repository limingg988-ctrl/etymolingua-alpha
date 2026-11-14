# Cloudflare Workers 版 AIプロキシ デプロイ手順

Firebase Functions 版はデプロイに Blaze プラン（クレジットカード登録）が必要なため、
サーバー役を **Cloudflare Workers の無料枠** に移した版です。
やることは「Worker を作る → 鍵を金庫（Secret）に入れる → URL をアプリに教える」の3つだけ。

- 料金：無料枠で **1日10万リクエスト** まで。このアプリの利用量なら十分すぎます。
- クレジットカード：**不要**です。

---

## 0. 先に用意するもの：新しい Gemini API キー

1. [Google AI Studio](https://aistudio.google.com/apikey) を **今のアカウント** で開く
2. 「APIキーを作成」で **新しいキー** を作る（サーバー専用。今ブラウザで使っている旧キーとは別にすること）
3. キーの文字列は、この後 Secret に貼るときだけ使う。チャットやメモに残さない

---

## 1-A. ダッシュボードでデプロイする（おすすめ・コマンド不要）

1. [Cloudflare](https://dash.cloudflare.com/sign-up) で無料アカウントを作る（カード不要）
2. 左メニューの **Workers & Pages** を開く
3. **Create** → **Workers** → Worker 名に `etymolingua-ai-proxy` と入力して作成
4. 作成後、**Edit code**（コードを編集）を開く
5. もともと入っているサンプルコードを全部消して、
   `worker/dist-paste/worker.js` の中身を **全部コピペ** する
6. **Deploy** ボタンを押す

これで Worker 本体は公開されます。ただこの時点ではまだ鍵が入っていないので動きません。次へ。

---

## 1-B. 鍵（Secret）を入れる

1. 作った Worker の **Settings** → **Variables and Secrets** を開く
2. **Add** → 種類は **Secret** を選ぶ
3. 名前：`GEMINI_API_KEY`（一字一句この通り）
4. 値：手順0で作った **新しいキー** を貼る
5. 保存（Deploy）する

> Secret に入れた値は画面から読み直すことができません。これが「金庫」という意味です。
> アプリの画面やプログラム（JavaScript）に鍵が混ざることはありません。

---

## 1-C. URL を Muse に教える

Worker の画面に表示される URL（例：`https://etymolingua-ai-proxy.<あなたのサブドメイン>.workers.dev`）を
コピーして、Muse に「これが Worker の URL」と伝えてください。

Muse 側でアプリの設定（`VITE_AI_PROXY_ORIGIN`）にその URL を入れて、
Firebase Hosting 側を再デプロイすると切り替えが完了します。

---

## 2. CLI でデプロイする（代替方法）

ターミナルが使える環境なら、こちらでも同じことができます。`worker/` フォルダで：

```bash
npm install
npx wrangler login
npx wrangler secret put GEMINI_API_KEY   # 新しいキーを貼る（入力は画面に表示されません）
npx wrangler deploy
```

デプロイ後に表示される workers.dev URL が、アプリに教える URL です。

---

## 3. 切り替え後にやること

- **旧キーの失効**：Hosting の再デプロイが終わって新しい構成で動くことを確認したら、
  ブラウザに埋め込まれていた **旧い Gemini キーを AI Studio で削除（失効）** してください。
  一度ブラウザに出た鍵は「漏れたもの」として扱うのが安全です。
- **Firebase Functions 版について**：`functions/` フォルダの Functions 版コードは
  そのまま置いておいて問題ありません（**デプロイしなければ** 課金も発生しません）。
  Blaze に上げる予定ができたときの予備として残してあります。

---

## 仕組みの超ざっくり版

- ブラウザは AI を直接呼ばず、この Worker に「この単語を調べて」と頼むだけ
- Worker は、頼んだ人がログイン済みユーザーか（会員証＝IDトークン）を確かめてから、
  金庫（Secret）の中の鍵で Gemini を呼んで、結果だけを返す
- 鍵はサーバー（Worker）の中だけにあり、サイトを見る人には渡らない
