# block gattai

同じ数字を、ぴたっと合体。くっついたペアは離れないスライドパズルです。

## ルール

- 同じ数字・同じ色のブロックが、それぞれ2つずつあります。
- 空きマスに向かって、選んだブロックを上下左右に1マス動かします。
- 同じ数字が上下左右に接すると、自動で合体します。斜めは対象外です。
- 合体したペアは2マスの形を保って移動します。分離・回転はできません。
- 全ペアが合体すればクリアです。行きづまったら一手戻すか、やり直せます。

| 難易度 | 盤面 | 空き | ペア | ステージ |
| --- | --- | --- | --- | --- |
| やさしい | 3 × 3 | 3マス | 3組 | 8 |
| ふつう | 4 × 3 | 2マス | 5組 | 8 |
| むずかしい | 3 × 3 | 1マス | 4組 | 8 |

24問すべて解答検証済みです。難易度は空きマスの制約を基準にしています。
各問は最短解答を持ち、ヒントはそこからの一手、または現在の盤面を探索して表示します。
探索が上限に達した場合は「見つけきれなかった」と表示し、解けないと断定しません。

## 操作

- マウス・タッチ：ブロックを選択して画面の矢印を押す、またはブロックをスワイプ／ドラッグ。
- キーボード：Tabでブロックへ移動しEnter/Spaceで選択、矢印キーで移動。
- 「一手戻す」「やり直す」「ヒント」は回数制限なし。
- クリア済みステージの印は、このブラウザのlocalStorageに保存します。

## ローカルで遊ぶ・開発する

Node.js 22以降。外部npmパッケージのインストールは不要です。

```sh
npm run dev
```

http://127.0.0.1:4173 を開いてください。ES ModulesとWorkerを利用するため、HTMLを直接ダブルクリックするのではなくHTTPサーバーから開きます。

```sh
npm test       # ルールと24問の解答手順を検証
npm run build # dist/ に静的公開ファイルを生成
```

## GitHub Pagesへの公開

1. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定します。
2. `main` にpushするか、Actionsから **Test and deploy GitHub Pages → Run workflow** を実行します。
3. 自動テスト成功後、`dist/` のファイルが公開されます。

公開先： https://hsgwyuki0429-design.github.io/block-gattai/

静的HTML/CSS/JavaScriptのみで動作します。すべてのアセットURLが相対パスなので、リポジトリ名配下のPagesでも利用できます。
GitHub Actionsを使わず **Deploy from a branch → main → /(root)** に設定しても動作します（この場合、自動テストと公開の連動はありません）。

参考：[GitHub Pagesのカスタムワークフロー](https://docs.github.com/ja/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## ファイル構成

- `index.html` / `style.css`：日本語UI・レスポンシブ表示
- `src/engine.js`：移動・合体・解答探索（DOM非依存）
- `src/app.js`：操作、表示、Undo、クリア演出
- `src/hint-worker.js`：画面を止めずにヒントを探索
- `src/levels.js`：検証済み24問と解答
- `scripts/generate-levels.mjs`：固定シードによる問題の再生成
- `tests/engine.test.mjs`：ルールと各ステージの検証
- `.github/workflows/pages.yml`：テスト・ビルド・公開

Google Fontsが読み込めない場合は端末内のフォントにフォールバックします。ゲーム処理や盤面データはすべて同じサイト内にあり、外部API・ログイン・サーバーは不要です。
