/**
 * プロジェクトAPIクライアント統合テスト
 *
 * VitestでAPIクライアント層を検証し、HTTPメソッド・ヘッダー・
 * レスポンス整形が期待通りに動作するかを確認する。
 */

import { beforeEach, afterEach, afterAll, describe, expect, it, vi } from 'vitest'
import {
  getProjects,
  createProject,
  deleteProject,
} from '@/lib/api/projects'
import type { ProjectCreateRequest } from '@/types/project'

/**
 * Supabaseクライアントをモックし、アクセストークン取得を制御する
 */
const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(() =>
    Promise.resolve({
      data: { session: { access_token: 'test-access-token' } },
    })
  ),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
    },
  },
}))

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  getSessionMock.mockClear()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

afterAll(() => {
  vi.restoreAllMocks()
})

describe('プロジェクトAPIクライアント', () => {
  it('プロジェクト一覧取得時にGETリクエストと認証ヘッダーを付与する', async () => {
    const mockResponse = {
      success: true,
      data: {
        projects: [
          {
            id: 'proj-001',
            user_id: '00000000-0000-4000-8000-0000e2e00001',
            name: 'API統合テストプロジェクト',
            description: 'Vitestで取得したプロジェクト',
            status: 'draft',
            customer_name: null,
            site_address: null,
            start_date: null,
            end_date: null,
            metadata: null,
            created_at: '2025-04-01T00:00:00.000Z',
            updated_at: '2025-04-02T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      },
    }

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    })

    const result = await getProjects(1, 20)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [requestedUrl, init] = fetchMock.mock.calls[0]
    expect(requestedUrl).toContain('/api/projects?page=1&page_size=20')
    expect(init?.method).toBe('GET')
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer test-access-token',
    })
    expect(result.data?.projects).toHaveLength(1)
    expect(result.data?.projects[0].name).toBe('API統合テストプロジェクト')
  })

  it('プロジェクト作成時にPOSTボディを正しく送信する', async () => {
    const payload: ProjectCreateRequest = {
      name: '新規作成テスト',
      status: 'active',
      customer_name: 'テスト顧客',
    }

    const mockProject = {
      ...payload,
      id: 'proj-created-001',
      user_id: '00000000-0000-4000-8000-0000e2e00001',
      description: null,
      site_address: null,
      start_date: null,
      end_date: null,
      metadata: null,
      created_at: '2025-04-03T10:00:00.000Z',
      updated_at: '2025-04-03T10:00:00.000Z',
    }

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockProject,
      }),
    })

    const result = await createProject(payload)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0]
    expect(init?.method).toBe('POST')

    const body = JSON.parse((init?.body as string) ?? '{}')
    expect(body).toMatchObject({
      name: '新規作成テスト',
      status: 'active',
      customer_name: 'テスト顧客',
    })

    expect(result.data?.id).toBe('proj-created-001')
    expect(result.data?.status).toBe('active')
  })

  it('削除失敗時にエラー情報を返却する', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        message: 'プロジェクトが見つかりません',
      }),
    })

    const result = await deleteProject('missing-id')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0]
    expect(init?.method).toBe('DELETE')
    expect(result.error).not.toBeUndefined()
    expect(result.error?.code).toBe('NOT_FOUND')
    expect(result.error?.message).toBe('プロジェクトが見つかりません')
  })
})
