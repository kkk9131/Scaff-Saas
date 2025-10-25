/**
 * プロジェクト管理E2Eテスト
 *
 * Playwrightを用いてプロジェクトの作成から削除までの一連フローを検証する。
 * バックエンドAPIはルートモックで再現し、UI操作に専念できるようにする。
 */

import { test, expect } from '@playwright/test'

const AUTH_BYPASS_ENABLED =
  process.env.NEXT_PUBLIC_E2E_AUTH_BYPASS === 'true'

/**
 * モックAPIレスポンス用のプロジェクト配列
 * テストごとに初期化して状態を共有する
 */
const initialProjects = [
  {
    id: 'project-initial-001',
    user_id: '00000000-0000-4000-8000-0000e2e00001',
    name: '既存案件A（テスト用）',
    description: 'E2Eテストの初期値として用意したプロジェクト',
    status: 'draft',
    customer_name: 'テスト建設株式会社',
    site_address: '東京都品川区1-2-3',
    start_date: '2025-03-01',
    end_date: '2025-03-31',
    metadata: null,
    created_at: '2025-02-15T09:00:00.000Z',
    updated_at: '2025-02-18T12:00:00.000Z',
  },
]

test.describe('プロジェクト作成〜削除フロー', () => {
  test('プロジェクトを新規作成し、その後削除できる', async ({ page }) => {
    test.skip(!AUTH_BYPASS_ENABLED, '認証バイパスが無効な環境では実行しません')
    test.setTimeout(120000) // テストタイムアウトを120秒に延長
    const projects = [...initialProjects]

    /**
     * プロジェクト一覧APIのモック
     * 一覧取得時は現在のprojects配列をそのまま返す
     */
    await page.route(/.*\/api\/projects(?:\?.*)?$/, async (route) => {
      const method = route.request().method()

      if (method === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': '*',
          },
          body: '',
        })
        return
      }

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: true,
            data: {
              projects,
              total: projects.length,
              page: 1,
              page_size: 100,
            },
          }),
        })
        return
      }

      if (method === 'POST') {
        const rawBody = route.request().postData()
        const body = rawBody ? JSON.parse(rawBody) : {}

        const timestamp = new Date('2025-04-01T02:00:00.000Z').toISOString()
        const newProject = {
          id: `project-e2e-${Date.now()}`,
          user_id: '00000000-0000-4000-8000-0000e2e00001',
          name: body.name ?? '名称未設定の案件',
          description: body.description ?? null,
          status: body.status ?? 'draft',
          customer_name: body.customer_name ?? null,
          site_address: body.site_address ?? null,
          start_date: body.start_date ?? null,
          end_date: body.end_date ?? null,
          metadata: body.metadata ?? null,
          created_at: timestamp,
          updated_at: timestamp,
        }

        projects.unshift(newProject)

        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: true,
            data: newProject,
          }),
        })
        return
      }

      await route.fallback()
  })

  /**
   * プロジェクト削除APIのモック
   * 指定IDを配列から削除し、成功レスポンスを返す
     */
    await page.route('**/api/projects/*', async (route) => {
      if (route.request().method() !== 'DELETE') {
        if (route.request().method() === 'OPTIONS') {
          await route.fulfill({
            status: 204,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
              'Access-Control-Allow-Headers': '*',
            },
            body: '',
          })
          return
        } else {
          await route.fallback()
          return
        }
      }

      const url = new URL(route.request().url())
      const projectId = url.pathname.split('/').pop() ?? ''
      const index = projects.findIndex((project) => project.id === projectId)

      if (index >= 0) {
        projects.splice(index, 1)
      }

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: { id: projectId, message: 'プロジェクトを削除しました' },
        }),
      })
    })

    // 認証バイパスが有効になっている前提で保護ページへ遷移
    // ページ遷移とAPIリクエストを並行して待機
    await Promise.all([
      page.waitForResponse(
        (response) => {
          return (
            response.url().includes('/api/projects') &&
            response.request().method() === 'GET'
          )
        },
        { timeout: 60000 } // タイムアウトを60秒に延長
      ),
      page.goto('/dashboard/projects', { waitUntil: 'networkidle', timeout: 60000 }),
    ])

    // ローディング表示が消えるまで待機（存在しない場合はスキップ）
    await page.getByText('読み込み中...').waitFor({ state: 'hidden' }).catch(() => {
      // ローディングが表示されない場合はスキップ
    })

    // ページの基本要素が表示されることを確認
    await expect(
      page.getByRole('heading', { name: 'プロジェクトボード' })
    ).toBeVisible({ timeout: 30000 })

    // 初期プロジェクトが一覧に表示されていること
    await expect(
      page.getByRole('heading', { name: initialProjects[0].name })
    ).toBeVisible()

    // 新規作成モーダルを開いて必要項目を入力
    await page.getByRole('button', { name: '新規プロジェクト' }).click()

    const newProjectName = 'E2Eテスト案件'
    await page.getByLabel('プロジェクト名').fill(newProjectName)
    await page
      .getByLabel('プロジェクト説明')
      .fill('Playwrightで生成したプロジェクトです')
    await page.getByLabel('顧客名').fill('架空電設株式会社')
    await page.getByLabel('現場住所').fill('神奈川県川崎市1-2-3')
    await page.getByLabel('開始日').fill('2025-04-10')
    await page.getByLabel('終了日').fill('2025-05-10')
    await page.getByLabel('ステータス').selectOption('active')

    await page.getByRole('button', { name: '作成' }).click()

    // 成功通知とカード表示を検証
    await expect(page.getByRole('status').first()).toContainText(
      `「${newProjectName}」を作成しました`
    )
    await expect(
      page.getByRole('heading', { name: newProjectName })
    ).toBeVisible()

    // カードをホバーして削除アクションを実行
    const newProjectCard = page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: newProjectName }) })
      .first()
    await newProjectCard.hover()
    await page.getByLabel('プロジェクトを削除').click()

    await expect(
      page.getByRole('button', { name: '削除する' })
    ).toBeVisible()
    await page.getByRole('button', { name: '削除する' }).click()

    await expect(page.getByRole('status').first()).toContainText(
      `「${newProjectName}」を削除しました`
    )
    await expect(
      page.getByRole('heading', { name: newProjectName })
    ).toHaveCount(0)
  })
})
