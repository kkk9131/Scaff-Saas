# アンチ追加機能（UX仕様）

本ドキュメントは、作図画面における「アンチ追加機能」のUXと実装方針をまとめたものです。

## 目的
- アンチが接していないブラケットを視覚的に把握し、クリック操作から素早くアンチを追加できるようにする。
- 追加したアンチはキャンバス上でドラッグ&ドロップにより微調整可能とする。

## 対象画面
- `frontend/src/app/(protected)/draw/page.tsx`（作図画面）

## 実装概要
- レンダラ（`ScaffoldRenderer.tsx`）で、各グループ内のブラケットとアンチの対応関係を判定。
  - ブラケットの `meta.offsetMm` が、いずれかのアンチの `[offsetMm, offsetMm+length]` の範囲内に含まれていれば「接している」と見なす。
  - 含まれない場合は「未接」とし、該当ブラケットを緑色に発光（グロー）させる。
- アンチ編集モード（`currentMode==='edit' && editTargetType==='アンチ'`）でのみ、緑発光とクリックオーバーレイを表示。
  - クリックで「アンチ追加カード（`AntiAddCard.tsx`）」を表示。

## アンチ追加カード（AntiAddCard）
- コンポーネント: `frontend/src/app/(protected)/draw/components/AntiAddCard.tsx`
- 表示条件: 緑発光中のブラケットをクリックしたとき。
- 入力項目:
  - 向き: 外側 / 内側
  - 幅: W=400mm / S=240mm
  - スパン: 1800 / 1500 / 1200 / 900 / 600 mm
- 作図仕様:
  - 中心はクリックしたブラケットの沿い方向オフセット（`offsetMm`）を基準とする。
  - 方向はグループのスパン方向（`group.meta.line`）に合わせる。
  - 法線方向は「向き」に応じて外側/内側へ配置（中心オフセット: W=350mm, S=170mm）。
  - `meta.offsetMm` は `(ブラケットoffsetMm - length/2)` を設定（範囲判定に一致するよう中央配置）。
  - 作図後はカードを自動クローズ。

## ドラッグ&ドロップ
- アンチ（Rect）の `Group` を `draggable` とし、`onDragEnd` で `position` をストアへ反映。
- 対象モードはアンチ編集モード時のみ（他モードではドラッグ無効）。

## 変更ファイル一覧
- `frontend/src/app/(protected)/draw/components/ScaffoldRenderer.tsx`
  - 緑発光（未接ブラケット）描画、クリックオーバーレイ追加
  - アンチRectのドラッグ&ドロップ対応
  - `onAntiAddRequest` コールバックを追加
- `frontend/src/app/(protected)/draw/components/CanvasStage.tsx`
  - `AntiAddCard` の状態と表示ロジック追加
  - `ScaffoldRenderer` への `onAntiAddRequest` を接続
- `frontend/src/app/(protected)/draw/components/AntiAddCard.tsx`
  - 新規追加（カードUIと作図ロジック）

## 操作ガイド（ユーザー向け）
1. 右上のモード切替で「編集」→対象「アンチ」を選択。
2. 緑色に発光しているブラケット上でクリック。
3. 表示されたカードで「向き・幅・スパン」を選択し「作図」。
4. 追加されたアンチはドラッグで位置を微調整可能。

## 備考
- 将来的に、カードに「数量」や「段数」などを併設する場合は、既存の `AntiQuantityCardUnified` / `AntiLevelCardUnified` を再利用・連携する。
- 集計ロジックやPDF/DXF出力への反映は別タスクで扱う。

