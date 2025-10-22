---
name: ui-spec-to-component
description: This skill converts UI specifications and component requirements into production-ready React components using shadcn/ui, TypeScript, and Tailwind CSS. Use this when the user describes UI elements, layouts, or interactive components in natural language and needs them implemented as reusable React components. Optimized for the ScaffAI project's tech stack with automatic accessibility support.
---

# UI Spec to Component

## Overview

Transform natural language UI specifications into production-ready React components with shadcn/ui integration, TypeScript type safety, Tailwind CSS styling, and built-in accessibility features.

## When to Use This Skill

Use this skill when:
- User describes UI components or layouts in natural language (Japanese or English)
- Need to create reusable React components for the ScaffAI project
- Converting design requirements into shadcn/ui-based implementations
- Building forms, cards, modals, tables, or other interactive UI elements
- Require TypeScript, Tailwind CSS, and accessibility compliance

**Trigger examples:**
- "プロジェクトカード、タイトル・ステータス・更新日表示、クリックで詳細へ"
- "足場図面のツールパネル、線・矩形・円・テキストボタン"
- "見積入力フォーム、項目名・数量・単価・自動計算表示"

## Core Workflow

### Step 1: Parse UI Specification

Extract component requirements from the user's description:

1. **Identify component type**: Card, Form, Table, Modal, Button, etc.
2. **Extract data fields**: What information to display or collect
3. **Detect interactions**: Click handlers, form submissions, state changes
4. **Determine layout**: Grid, flex, list, or custom arrangement
5. **Identify parent-child relationships**: Nested components or composition patterns

**Example:**
```
Input: "プロジェクトカード、タイトル・ステータス・更新日表示、クリックで詳細へ"

Parsed:
- Component Type: Card
- Data Fields:
  - title (string)
  - status (enum: active/pending/completed)
  - updatedAt (Date)
- Interactions:
  - onClick → navigate to details
- Layout: Vertical stack with badge for status
- Accessibility: Button role, keyboard navigation
```

### Step 2: Select shadcn/ui Components

Map the UI requirements to appropriate shadcn/ui components:

**Common Mappings:**
- **Card/Panel** → `Card`, `CardHeader`, `CardContent`
- **Button** → `Button` (with variant: default, outline, ghost, destructive)
- **Form** → `Form`, `FormField`, `Input`, `Label`
- **Modal/Dialog** → `Dialog`, `DialogContent`, `DialogTrigger`
- **Table** → `Table`, `TableHeader`, `TableBody`, `TableRow`
- **List** → Custom with `Card` or native `<ul>`
- **Dropdown** → `Select`, `SelectTrigger`, `SelectContent`
- **Status Badge** → `Badge`
- **Loading** → `Skeleton`
- **Notification** → `useToast` hook

**Reference**: Load `references/shadcn_components.md` for complete component API and usage patterns.

### Step 3: Design TypeScript Interfaces

Define TypeScript types for props and data:

```typescript
// Component props interface
interface ComponentNameProps {
  // Data props
  title: string;
  status: 'active' | 'pending' | 'completed';
  updatedAt: Date;

  // Event handlers
  onClick?: () => void;

  // Optional styling
  className?: string;
}

// Data model (if needed)
interface DataModel {
  id: string;
  // ... other fields
}
```

### Step 4: Generate React Component

Create a TypeScript React component with:
- shadcn/ui component imports
- TypeScript props interface
- JSDoc comments in Japanese
- Tailwind CSS styling
- ARIA attributes for accessibility
- Event handlers
- Conditional rendering
- Error states

**Template structure:**
```tsx
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * コンポーネントの説明（日本語）
 *
 * @param props - コンポーネントのプロパティ
 * @returns JSX.Element
 */
interface ComponentNameProps {
  title: string;
  status: 'active' | 'pending' | 'completed';
  updatedAt: Date;
  onClick?: () => void;
  className?: string;
}

export function ComponentName({
  title,
  status,
  updatedAt,
  onClick,
  className,
}: ComponentNameProps) {
  // ステータスバッジの色を決定
  const statusVariant = {
    active: 'default',
    pending: 'secondary',
    completed: 'outline',
  }[status] as 'default' | 'secondary' | 'outline';

  // 更新日のフォーマット
  const formattedDate = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(updatedAt);

  return (
    <Card
      className={cn('cursor-pointer hover:shadow-lg transition-shadow', className)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant={statusVariant}>
            {status === 'active' && '稼働中'}
            {status === 'pending' && '保留中'}
            {status === 'completed' && '完了'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          更新日: {formattedDate}
        </p>
      </CardContent>
    </Card>
  );
}
```

### Step 5: Add Accessibility Features

Ensure WCAG compliance:

1. **Semantic HTML**: Use appropriate HTML5 elements
2. **ARIA Attributes**: Add `role`, `aria-label`, `aria-describedby` when needed
3. **Keyboard Navigation**: Support Tab, Enter, Space, Escape keys
4. **Focus Management**: Visible focus indicators, logical tab order
5. **Screen Reader Support**: Meaningful labels and descriptions
6. **Color Contrast**: Ensure 4.5:1 contrast ratio minimum

**Accessibility Checklist:**
- [ ] Keyboard accessible (Tab, Enter, Space)
- [ ] Focus indicators visible
- [ ] ARIA labels for icon-only buttons
- [ ] Color not sole indicator
- [ ] Error messages announced to screen readers
- [ ] Heading hierarchy logical

### Step 6: Add Responsive Design

Use Tailwind CSS responsive prefixes:

```tsx
<div className="
  grid grid-cols-1           // Mobile: 1 column
  sm:grid-cols-2             // Small: 2 columns
  md:grid-cols-3             // Medium: 3 columns
  lg:grid-cols-4             // Large: 4 columns
  gap-4                      // Consistent spacing
">
  {/* Cards */}
</div>
```

**Breakpoints:**
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px
- `2xl:` 1536px

### Step 7: Generate Usage Example

Provide a complete usage example:

```tsx
// pages/projects.tsx
import { ComponentName } from '@/components/ComponentName';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const router = useRouter();

  const projects = [
    {
      id: '1',
      title: 'プロジェクトA',
      status: 'active' as const,
      updatedAt: new Date('2025-10-22'),
    },
    // ... more projects
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">プロジェクト一覧</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ComponentName
            key={project.id}
            title={project.title}
            status={project.status}
            updatedAt={project.updatedAt}
            onClick={() => router.push(`/projects/${project.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
```

## Output Format

Provide the complete implementation in the following structure:

```markdown
## 📋 コンポーネント仕様
[UI要件の要約]

## 🎨 使用するshadcn/uiコンポーネント
- [コンポーネント1]
- [コンポーネント2]

## 📘 TypeScript型定義

\`\`\`typescript
[インターフェース定義]
\`\`\`

## ⚛️ Reactコンポーネント実装

\`\`\`tsx
[完全なコンポーネントコード]
\`\`\`

## ♿ アクセシビリティ対応
- [実装された機能1]
- [実装された機能2]

## 📱 レスポンシブ対応
- モバイル: [説明]
- タブレット: [説明]
- デスクトップ: [説明]

## 📝 使用例

\`\`\`tsx
[実際の使用例コード]
\`\`\`

## 🎯 追加実装の提案（オプション）
- [拡張機能の提案1]
- [拡張機能の提案2]
```

## Best Practices

1. **Component Composition**: Break complex UIs into smaller, reusable components
2. **TypeScript Strict Mode**: Use strict type checking for props and state
3. **Tailwind Utilities**: Prefer Tailwind utilities over custom CSS
4. **Consistent Naming**: Use PascalCase for components, camelCase for props
5. **Japanese Comments**: All JSDoc comments in Japanese for ScaffAI project
6. **Accessibility First**: Never skip accessibility features
7. **Performance**: Use React.memo for expensive components
8. **Error Boundaries**: Wrap complex components in error boundaries

## Common ScaffAI Component Patterns

### Project Card
```
Input: "プロジェクトカード、名前・ステータス・更新日・クリックで詳細"
Output: Card component with Badge, formatted date, onClick handler
```

### Drawing Toolbar
```
Input: "作図ツールパネル、線・矩形・円・テキストボタン、選択中のツールをハイライト"
Output: Toolbar with Button group, active state management
```

### Estimate Form
```
Input: "見積入力フォーム、項目名・数量・単価、合計を自動計算"
Output: Form with Input fields, auto-calculated total, validation
```

### Modal Dialog
```
Input: "確認ダイアログ、削除確認メッセージ・キャンセル・削除ボタン"
Output: Dialog component with danger variant button
```

## Integration with ScaffAI

This skill is designed for the ScaffAI project structure:

- **Components**: Generate in `frontend/components/` or `frontend/app/(protected)/[page]/components/`
- **UI Kit**: Use shadcn/ui from `frontend/components/ui/`
- **Types**: Share types with backend in `shared/types/`
- **Styling**: Follow Tailwind config in `frontend/tailwind.config.ts`
- **Accessibility**: Meet ScaffAI WCAG 2.1 AA requirements
- **i18n**: Japanese-first UI text, prepared for future localization

## Loading Reference Documentation

When implementing complex components, load the shadcn/ui reference:

```
Read references/shadcn_components.md for:
- Complete component API
- Import statements
- Usage patterns
- Variant options
```

This ensures accurate shadcn/ui component usage without guessing APIs.
