# ScaffAI UI デフォルト設計ガイド（v1）

このドキュメントは、今後実装する画面で統一的に使用する「色・コンポーネント・装飾」のデフォルト方針をまとめたものです。ログイン／ダッシュボード／プロジェクト／プロジェクト詳細で確定した見た目をベースにしています。

## 基本コンセプト
- 透明ガラス（フロスト）＋薄いボーダー＋淡いグラデのトップコート
- ライトは黒文字、ダークは白文字（カード内部は明瞭なコントラスト）
- 要素の角は大きめ（`rounded-2xl`）で操作感を強調
- アクセントは水色系（シアン〜インディゴ）。場面に応じてエメラルドを混ぜた“Aurora”系グラデを採用

## カラートークン（Tailwind 変数）
Tailwind v4 の CSS 変数を `globals.css` に定義済みです。

- ベース: `--background`, `--foreground`
- カード: `--card`, `--card-foreground`
- アクセント: `--primary`, `--secondary`, `--accent`
- 状態: `--success`, `--warning`, `--destructive`

原則として、コンポーネント内で生色は直接使わず、既存のトークン or 下記のクラスプリセットを利用してください。

## 透明ガラスカードの標準
カード（パネル）ラッパーには必ず以下の質感を適用します。

- ラッパーには `glass-scope` を付与
- ベースクラス（例）
  ```tsx
  <section
    className="glass-scope relative overflow-hidden rounded-2xl border border-white/40 dark:border-slate-700/60 bg-transparent dark:bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 dark:shadow-slate-900/50 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30"
  >
    ...
  </section>
  ```

### カード内テキストの色ルール（自動）
`globals.css` に以下を定義済みです。

- ライト: `.glass-scope` 内は黒へ統一（白／グレー系クラスも黒化）
- ダーク: `.glass-scope` 内の白系テキストは白を維持

これにより、コンポーネント側で細かく `text-black`/`text-white` を指定しなくても、モードに応じて読める色になります。

## クイックアクション系のグラデ
- オーバーレイは `before:bg-gradient-to-br` で薄くのせる（例: `to-[#6366F1]/30`）
- アイコン背景は `bg-gradient-to-br from-*-*/25 via-*/30 to-*/35` 程度の淡い割合

例（ボタンの見た目合わせ）
```tsx
<button className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 p-6 backdrop-blur-xl shadow-lg before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-[#06B6D4]/0 before:via-[#22D3EE]/0 before:to-[#0EA5E9]/30">
  ...
</button>
```

## ボタンのAuroraグラデ（ログイン）
ログインの主要ボタンは以下を標準とします。

```tsx
className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:from-emerald-400/90 hover:via-cyan-400/90 hover:to-indigo-500/90 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-cyan-500/30 focus-visible:ring-emerald-300"
```

用途: 主要CTA（ログイン／確定アクション）。二次アクションは `variant="outline"` 等を使用。

## チャット“ヒーロー”テキストの色
- スコープ: `.chat-hero`
- ルール: ライト=黒、ダーク=白（`globals.css` で既定）。
  - ヒーローテキストを `.chat-hero` で囲うことで色が自動適用されます。

## プロジェクト系画面のカード
- 一覧／詳細ともにカードラッパーへ「透明ガラス標準」を適用
- バッジや丸背景は `bg-transparent + border + backdrop-blur` を基本

## 実装ガイド
1) 新規画面はカードラッパーに `glass-scope` を付けて「透明ガラス標準」を使用
2) 強調見出しやヒーロー文は `.chat-hero` を膨らませて適用可（ライト=黒／ダーク=白）
3) 主要ボタンは Aurora グラデ。サブは `outline` / `ghost` 等
4) クイックアクションは薄い `before:` グラデで一貫性を保つ

## 運用メモ
- ライトで“灰っぽく”見える時は `bg-white/10` 程度の薄いベール＋ `backdrop-blur-xl` を確認
- テキストが読みにくい時は、スコープクラス（`glass-scope`/`chat-hero`）が外れていないかを確認

---

最終更新: 2025-10-27

