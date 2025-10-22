'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
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
  DotSpinner,
  Modal,
  ConfirmModal,
  useToast,
  Header,
  Sidebar,
  ChatSidebar,
  type ChatMessage,
} from '@/components';

/**
 * ホームページ（コンポーネントショーケース）
 *
 * 全ての共通UIコンポーネントのデモを表示
 * 職人向けの直感的でワクワクするUIを体験
 */
export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();

  // トースト通知のデモ
  const showSuccessToast = () => {
    toast({
      title: '保存しました！',
      description: 'プロジェクトが正常に保存されました',
      type: 'success',
    });
  };

  const showErrorToast = () => {
    toast({
      title: 'エラーが発生しました',
      description: 'もう一度お試しください',
      type: 'error',
    });
  };

  const showWarningToast = () => {
    toast({
      title: '注意',
      description: 'この操作には確認が必要です',
      type: 'warning',
    });
  };

  const showInfoToast = () => {
    toast({
      title: '情報',
      description: '新しいアップデートが利用可能です',
      type: 'info',
    });
  };

  // ローディングデモ
  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showSuccessToast();
    }, 2000);
  };

  // チャットメッセージ送信ハンドラー
  const handleSendMessage = (content: string) => {
    // ユーザーメッセージを追加
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    // AI応答をシミュレート（実際はOpenAI APIを呼び出す）
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: `「${content}」について理解しました。足場設計のお手伝いをさせていただきます。具体的にどのような点でサポートが必要でしょうか？`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <>
      {/* ヘッダー */}
      <Header
        userName="山田太郎"
        onLogout={() => alert('ログアウトしました')}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobileMenuOpen={isSidebarOpen}
        onChatToggle={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
      />

      {/* 左サイドバー */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 右サイドバー（AIチャット） */}
      <ChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />

      {/* メインコンテンツ */}
      <main className={cn(
        "min-h-screen bg-gradient-to-br from-white via-[#6366F1]/5 to-[#06B6D4]/5 pt-16 transition-all duration-300",
        "dark:from-slate-900 dark:via-[#6366F1]/10 dark:to-[#06B6D4]/10",
        isSidebarOpen ? "md:pl-64" : "md:pl-20"
      )}>
        <div className="container mx-auto space-y-12 p-6">
          {/* ヒーローセクション */}
          <section className="animate-fade-in-up space-y-6 text-center">
            <h1 className="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
              ScaffAI
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-700 dark:text-gray-300">
              職人のための、革新的な足場業務支援SaaS
              <br />
              <span className="font-bold text-[#6366F1] dark:text-[#8B5CF6]">
                現場で使いやすい、ワクワクするUI
              </span>
            </p>
          </section>

          {/* ボタンセクション */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">ボタンコンポーネント</h2>
            <Card hoverable>
              <CardHeader>
                <CardTitle>大きくて押しやすいボタン</CardTitle>
                <CardDescription>
                  手袋をつけていても操作できる、職人向けデザイン
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* デフォルトボタン */}
                <div className="flex flex-wrap gap-3">
                  <Button>デフォルト</Button>
                  <Button variant="secondary">セカンダリ</Button>
                  <Button variant="outline">アウトライン</Button>
                  <Button variant="ghost">ゴースト</Button>
                  <Button variant="link">リンク</Button>
                </div>

                {/* カラーバリエーション */}
                <div className="flex flex-wrap gap-3">
                  <Button variant="success">完了</Button>
                  <Button variant="warning">注意</Button>
                  <Button variant="destructive">削除</Button>
                </div>

                {/* サイズバリエーション */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">小</Button>
                  <Button size="default">標準</Button>
                  <Button size="lg">大</Button>
                  <Button size="xl">特大</Button>
                </div>

                {/* ローディング状態 */}
                <div className="flex flex-wrap gap-3">
                  <Button isLoading>送信中...</Button>
                  <Button variant="secondary" isLoading>
                    読み込み中...
                  </Button>
                </div>

                {/* アイコン付き */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    iconLeft={
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    }
                  >
                    新規作成
                  </Button>
                  <Button
                    variant="outline"
                    iconRight={
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    }
                  >
                    次へ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 入力フィールドセクション */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">入力フィールド</h2>
            <Card hoverable>
              <CardHeader>
                <CardTitle>視認性の高い入力フィールド</CardTitle>
                <CardDescription>
                  大きな文字と明確なフォーカス状態
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="プロジェクト名" placeholder="〇〇マンション" />
                <Input
                  label="メールアドレス"
                  type="email"
                  placeholder="example@example.com"
                />
                <Input
                  label="パスワード"
                  type="password"
                  placeholder="8文字以上"
                  error="パスワードは8文字以上で入力してください"
                />
                <Input
                  label="検索"
                  placeholder="プロジェクトを検索..."
                  leftElement={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  }
                />
              </CardContent>
            </Card>
          </section>

          {/* カードセクション */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">カードコンポーネント</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card hoverable clickable>
                <CardHeader>
                  <CardTitle>〇〇マンション</CardTitle>
                  <CardDescription>進行中のプロジェクト</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    作業進捗: 65%
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: '65%' }}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline">
                    詳細を見る
                  </Button>
                </CardFooter>
              </Card>

              <Card hoverable clickable>
                <CardHeader>
                  <CardTitle>△△ビル</CardTitle>
                  <CardDescription>見積作成中</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    作業進捗: 30%
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-warning transition-all"
                      style={{ width: '30%' }}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline">
                    詳細を見る
                  </Button>
                </CardFooter>
              </Card>

              <Card hoverable clickable>
                <CardHeader>
                  <CardTitle>□□アパート</CardTitle>
                  <CardDescription>完了</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    作業進捗: 100%
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-success transition-all"
                      style={{ width: '100%' }}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="success">
                    完了済み
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>

          {/* フィードバックセクション */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">フィードバック</h2>
            <Card hoverable>
              <CardHeader>
                <CardTitle>通知・ローディング・ダイアログ</CardTitle>
                <CardDescription>
                  明確なフィードバックで操作結果を伝える
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* トースト通知 */}
                <div>
                  <h3 className="mb-3 font-semibold">トースト通知</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={showSuccessToast} variant="success">
                      成功通知
                    </Button>
                    <Button onClick={showErrorToast} variant="destructive">
                      エラー通知
                    </Button>
                    <Button onClick={showWarningToast} variant="warning">
                      警告通知
                    </Button>
                    <Button onClick={showInfoToast}>情報通知</Button>
                  </div>
                </div>

                {/* ローディング */}
                <div>
                  <h3 className="mb-3 font-semibold">ローディング</h3>
                  <div className="flex flex-wrap items-center gap-6">
                    <LoadingSpinner size="sm" />
                    <LoadingSpinner size="md" />
                    <LoadingSpinner size="lg" />
                    <DotSpinner />
                  </div>
                  <Button onClick={simulateLoading} className="mt-4">
                    ローディングデモ
                  </Button>
                </div>

                {/* モーダル */}
                <div>
                  <h3 className="mb-3 font-semibold">モーダル</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setIsModalOpen(true)}>
                      モーダルを開く
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setIsConfirmOpen(true)}
                    >
                      確認ダイアログ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* ローディング全画面 */}
        {isLoading && (
          <LoadingSpinner
            fullScreen
            size="xl"
            text="データを処理しています..."
          />
        )}
      </main>

      {/* モーダル */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="モーダルのデモ"
        description="これは汎用的なモーダルダイアログです"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={() => {
                setIsModalOpen(false);
                showSuccessToast();
              }}
            >
              確定
            </Button>
          </>
        }
      >
        <p className="text-muted-foreground">
          モーダルの中に任意のコンテンツを配置できます。
          <br />
          職人が使いやすい大きなボタンと明確なアクションで、
          <br />
          重要な操作をサポートします。
        </p>
      </Modal>

      {/* 確認ダイアログ */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          showSuccessToast();
        }}
        title="プロジェクトを削除"
        description="この操作は取り消せません。本当に削除しますか？"
        confirmText="削除"
        variant="destructive"
      />
    </>
  );
}
