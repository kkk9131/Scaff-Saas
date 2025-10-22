'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

/**
 * チャットメッセージの型定義
 */
export interface ChatMessage {
  /**
   * メッセージID
   */
  id: string;

  /**
   * 送信者タイプ
   */
  role: 'user' | 'assistant';

  /**
   * メッセージ内容
   */
  content: string;

  /**
   * タイムスタンプ
   */
  timestamp: Date;
}

/**
 * ChatSidebarコンポーネントのプロパティ型定義
 */
export interface ChatSidebarProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * サイドバーが開いているか
   */
  isOpen?: boolean;

  /**
   * サイドバーを閉じるハンドラー
   */
  onClose?: () => void;

  /**
   * サイドバーを開くハンドラー
   */
  onOpen?: () => void;

  /**
   * サイドバーの開閉をトグルするハンドラー
   */
  onToggle?: () => void;

  /**
   * チャット履歴
   */
  messages?: ChatMessage[];

  /**
   * メッセージ送信ハンドラー
   */
  onSendMessage?: (message: string) => void;
}

/**
 * ChatSidebarコンポーネント
 *
 * 右側に固定されるAIチャットサイドバー
 * - リアルタイムAI対話
 * - チャット履歴表示
 * - 開閉可能
 * - レスポンシブ対応
 *
 * 使用例:
 * ```tsx
 * <ChatSidebar
 *   isOpen={isChatOpen}
 *   onToggle={toggleChat}
 *   messages={chatMessages}
 *   onSendMessage={handleSendMessage}
 * />
 * ```
 */
const ChatSidebar = React.forwardRef<HTMLElement, ChatSidebarProps>(
  (
    {
      className,
      isOpen = false,
      onClose,
      onOpen,
      onToggle,
      messages = [],
      onSendMessage,
      ...props
    },
    ref
  ) => {
    const [inputMessage, setInputMessage] = React.useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    // メッセージが追加されたら自動スクロール
    React.useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // メッセージ送信処理
    const handleSend = () => {
      if (inputMessage.trim() && onSendMessage) {
        onSendMessage(inputMessage.trim());
        setInputMessage('');
      }
    };

    // Enterキーで送信
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    return (
      <>
        {/* オーバーレイ（モバイル時のみ） */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* チャットサイドバー本体 */}
        <aside
          ref={ref}
          className={cn(
            // 基本レイアウト
            'fixed right-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-96 flex-col',
            'border-l-2 border-gray-200 bg-white shadow-lg',
            'dark:border-gray-700 dark:bg-slate-900',
            // アニメーション
            'transition-transform duration-300 ease-in-out',
            // 開閉状態の制御（全画面サイズで適用）
            isOpen ? 'translate-x-0' : 'translate-x-full',
            className
          )}
          {...props}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b-2 border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              {/* AIアイコン */}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-md">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-foreground">AIアシスタント</h3>
                <p className="text-xs text-muted-foreground">
                  足場設計をサポート
                </p>
              </div>
            </div>

            {/* 閉じるボタン（モバイルのみ） */}
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-all hover:bg-accent/10 md:hidden"
              aria-label="チャットを閉じる"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* メッセージエリア */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
            {messages.length === 0 ? (
              // 初期メッセージ
              <div className="flex h-full items-center justify-center">
                <div className="max-w-sm text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                      <svg
                        className="h-8 w-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h4 className="mb-2 text-lg font-bold text-foreground">
                    AIアシスタントにお任せ
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    足場設計のことなら何でも聞いてください。
                    <br />
                    自動見積や図面解析もサポートします。
                  </p>
                </div>
              </div>
            ) : (
              // チャット履歴
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {/* AIアバター（アシスタントの場合） */}
                    {message.role === 'assistant' && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* メッセージバブル */}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-4 py-2',
                        message.role === 'user'
                          ? 'bg-[#6366F1] text-white dark:bg-[#8B5CF6]'
                          : 'bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-gray-100'
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={cn(
                          'mt-1 text-xs',
                          message.role === 'user'
                            ? 'text-white/70'
                            : 'text-muted-foreground'
                        )}
                      >
                        {message.timestamp.toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* ユーザーアバター（ユーザーの場合） */}
                    {message.role === 'user' && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-accent text-sm font-bold text-white">
                        U
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* 入力エリア */}
          <div className="border-t-2 border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="メッセージを入力..."
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!inputMessage.trim()}
                size="default"
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
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                }
              >
                送信
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Shift + Enter で改行 | Enter で送信
            </p>
          </div>
        </aside>
      </>
    );
  }
);

ChatSidebar.displayName = 'ChatSidebar';

export { ChatSidebar };
