# ScaffAI Frontend - 共通UIコンポーネントシステム

**TASK-102**: 共通UIコンポーネント作成

## 🎨 完成した共通UIコンポーネント

### 基本UIコンポーネント

#### Button（ボタン）
- **特徴**: 手袋をつけていても押しやすい大きなボタン
- **バリアント**: default, secondary, destructive, outline, ghost, link, success, warning
- **サイズ**: sm, default, lg, xl, icon
- **機能**: ローディング状態、左右アイコン対応

#### Input（入力フィールド）
- **特徴**: 視認性の高い大きなフォント、明確なフォーカス状態
- **機能**: ラベル、エラー表示、左右要素（アイコン）配置、全幅表示

#### Card（カード）
- **特徴**: 美しい影とボーダー、ホバー効果
- **サブコンポーネント**: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **機能**: ホバー効果、クリック可能

### レイアウトコンポーネント

#### Header（ヘッダー）
- **特徴**: グラスモルフィズム、レスポンシブ対応
- **機能**: ユーザーメニュー、ダークモード切替、通知、モバイルメニュー

#### Sidebar（サイドバー）
- **特徴**: レスポンシブ、アイコン＋テキスト
- **機能**: アクティブ状態表示、バッジ表示、子ナビゲーション

### フィードバックコンポーネント

#### Toast（通知）
- **特徴**: 4種類の通知タイプ（success, error, warning, info）
- **機能**: 自動消去、アイコン付き、スタック表示

#### LoadingSpinner（ローディング）
- **特徴**: 二重円の回転アニメーション
- **バリアント**: InlineSpinner, DotSpinner
- **機能**: 全画面オーバーレイ、サイズ・色変更

#### Modal（モーダル）
- **特徴**: フォーカストラップ、ESCキー対応
- **サブコンポーネント**: ConfirmModal（確認ダイアログ）
- **機能**: オーバーレイクリック対応、複数サイズ

## 🎯 デザインコンセプト

### 職人向けUI/UX
- **大きなタッチターゲット**: 手袋をつけていても操作可能
- **明確な視覚的フィードバック**: アニメーション、ホバー効果
- **直感的なアイコン**: 文字が読めなくても理解できる

### カラーシステム
- **Primary**: セーフティオレンジ（#FF6B1A）- 建設現場の活力
- **Secondary**: 鉄骨グレー（#62728A）- 足場の堅牢性
- **Accent**: スカイブルー（#0D99E6）- 現場の空
- **Success**: グリーン（#22B573）- 作業完了
- **Warning**: イエロー（#F0B90B）- 注意喚起
- **Destructive**: レッド（#ED4343）- 危険

### アニメーション
- **fade-in-up**: 上からスライド
- **scale-in**: スケールアップ
- **slide-in-left/right**: 左右からスライド
- **hover-lift**: ホバー時持ち上がり効果
- **hover-glow**: ホバー時輝き効果

## 🚀 使用方法

### 開発サーバーの起動

```bash
cd frontend
npm install
npm run dev
```

http://localhost:3001 でコンポーネントショーケースが表示されます。

### コンポーネントのインポート

```tsx
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  LoadingSpinner,
  Modal,
  useToast,
  Header,
  Sidebar,
} from '@/components';
```

### 使用例

#### ボタン
```tsx
<Button variant="primary" size="lg">
  新規作成
</Button>

<Button variant="destructive" isLoading>
  削除中...
</Button>
```

#### 入力フィールド
```tsx
<Input
  label="プロジェクト名"
  placeholder="〇〇マンション"
  error="必須項目です"
/>
```

#### トースト通知
```tsx
const { toast } = useToast();

toast({
  title: '保存しました！',
  description: 'プロジェクトが正常に保存されました',
  type: 'success',
});
```

## 📂 ディレクトリ構造

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── Toast.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── index.ts
│   └── index.ts
├── lib/
│   └── utils.ts
└── app/
    ├── globals.css
    ├── layout.tsx
    └── page.tsx
```

## ✅ 完了条件

- [x] 全コンポーネントが単独で動作
- [x] レスポンシブ対応（モバイル・タブレット・デスクトップ）
- [x] アクセシビリティ考慮（ARIA属性）
- [x] 初心者でも理解できる日本語コメント

## 🎉 次のステップ

- **TASK-103**: バックエンドAPI基盤構築
- **TASK-104**: 状態管理セットアップ
- **TASK-101**: Supabase Auth統合

---

**デザインフィロソフィー**: "職人が現場で使いやすい、ワクワクする革新的UI"
