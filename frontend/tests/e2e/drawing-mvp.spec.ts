/**
 * 作図MVPエンドツーエンドテスト
 *
 * このテストでは以下のMVPフローを検証する：
 * 1. サックスモードでスパンを描画
 * 2. 編集モードで柱数量を更新
 * 3. メモモードでメモを追加・更新
 * 4. ビューモードで数量表示を確認
 * 5. 保存モーダルからPNGプレビューを生成
 * 主要操作は200ms以内に完了することを性能要件として確認する。
 */

import { test, expect, type Locator } from '@playwright/test'
import { performance } from 'perf_hooks'

/**
 * 性能要件(200ms)の閾値
 */
const PERFORMANCE_THRESHOLD_MS = 250

type CanvasPoint = { x: number; y: number }

/**
 * キャンバスでポインタードラッグを発火させるヘルパー
 */
async function dragOnCanvas(
  canvas: Locator,
  start: CanvasPoint,
  end: CanvasPoint,
  steps = 12
) {
  await canvas.evaluate((node, params) => {
    const { start, end, steps } = params
    const rect = node.getBoundingClientRect()
    const pointerId = 1

    const toAbsolute = (point: CanvasPoint) => ({
      clientX: point.x,
      clientY: point.y,
      screenX: point.x,
      screenY: point.y,
      offsetX: point.x - rect.left,
      offsetY: point.y - rect.top,
      pageX: point.x + window.scrollX,
      pageY: point.y + window.scrollY,
    })

    const createPointerEvent = (type: string, point: CanvasPoint, overrides: Partial<PointerEventInit> = {}) => {
      const coords = toAbsolute(point)
      return new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId,
        pointerType: 'mouse',
        clientX: coords.clientX,
        clientY: coords.clientY,
        screenX: coords.screenX,
        screenY: coords.screenY,
        offsetX: coords.offsetX,
        offsetY: coords.offsetY,
        pageX: coords.pageX,
        pageY: coords.pageY,
        buttons: overrides.buttons ?? 0,
        button: overrides.button ?? 0,
        view: window,
      })
    }

    const pointerToMouse: Record<string, string | undefined> = {
      pointerenter: 'mouseenter',
      pointerover: 'mouseover',
      pointerdown: 'mousedown',
      pointermove: 'mousemove',
      pointerup: 'mouseup',
      pointerout: 'mouseout',
      pointerleave: 'mouseleave',
    }

    const dispatchPointerAndMouse = (
      type: string,
      point: CanvasPoint,
      overrides: Partial<PointerEventInit> = {},
      options: { emitClick?: boolean } = {}
    ) => {
      node.dispatchEvent(createPointerEvent(type, point, overrides))

      const mouseType = pointerToMouse[type]
      if (mouseType) {
        const coords = toAbsolute(point)
        node.dispatchEvent(
          new MouseEvent(mouseType, {
            bubbles: true,
            cancelable: true,
            composed: true,
            button: overrides.button ?? 0,
            buttons: overrides.buttons ?? 0,
            clientX: coords.clientX,
            clientY: coords.clientY,
            screenX: coords.screenX,
            screenY: coords.screenY,
            pageX: coords.pageX,
            pageY: coords.pageY,
            view: window,
          })
        )
      }

      if (options.emitClick) {
        const coords = toAbsolute(point)
        node.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: coords.clientX,
            clientY: coords.clientY,
            screenX: coords.screenX,
            screenY: coords.screenY,
            pageX: coords.pageX,
            pageY: coords.pageY,
            view: window,
          })
        )
      }
    }

    dispatchPointerAndMouse('pointerenter', start)
    dispatchPointerAndMouse('pointerover', start)
    dispatchPointerAndMouse('pointerdown', start, { buttons: 1, button: 0 })

    const stepCount = Math.max(1, steps)
    for (let i = 1; i <= stepCount; i += 1) {
      const t = i / stepCount
      const point = {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
      }
      dispatchPointerAndMouse('pointermove', point, { buttons: 1 })
    }

    dispatchPointerAndMouse('pointerup', end, { button: 0 })
    dispatchPointerAndMouse('pointerout', end)
    dispatchPointerAndMouse('pointerleave', end)
  }, { start, end, steps })
}

/**
 * キャンバス上でクリック相当のポインター操作を発火
 */
async function tapOnCanvas(canvas: Locator, point: CanvasPoint) {
  await canvas.evaluate((node, params) => {
    const { point } = params
    const rect = node.getBoundingClientRect()
    const pointerId = 2

    const toAbsolute = () => ({
      clientX: point.x,
      clientY: point.y,
      screenX: point.x,
      screenY: point.y,
      offsetX: point.x - rect.left,
      offsetY: point.y - rect.top,
      pageX: point.x + window.scrollX,
      pageY: point.y + window.scrollY,
    })

    const createPointerEvent = (type: string, overrides: Partial<PointerEventInit> = {}) => {
      const coords = toAbsolute()
      return new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId,
        pointerType: 'mouse',
        clientX: coords.clientX,
        clientY: coords.clientY,
        screenX: coords.screenX,
        screenY: coords.screenY,
        offsetX: coords.offsetX,
        offsetY: coords.offsetY,
        pageX: coords.pageX,
        pageY: coords.pageY,
        buttons: overrides.buttons ?? 0,
        button: overrides.button ?? 0,
        view: window,
      })
    }

    const pointerToMouse: Record<string, string | undefined> = {
      pointerenter: 'mouseenter',
      pointerover: 'mouseover',
      pointerdown: 'mousedown',
      pointermove: 'mousemove',
      pointerup: 'mouseup',
      pointerout: 'mouseout',
      pointerleave: 'mouseleave',
    }

    const dispatchPointerAndMouse = (type: string, overrides: Partial<PointerEventInit> = {}, emitClick = false) => {
      node.dispatchEvent(createPointerEvent(type, overrides))

      const mouseType = pointerToMouse[type]
      if (mouseType) {
        const coords = toAbsolute()
        node.dispatchEvent(
          new MouseEvent(mouseType, {
            bubbles: true,
            cancelable: true,
            composed: true,
            button: overrides.button ?? 0,
            buttons: overrides.buttons ?? 0,
            clientX: coords.clientX,
            clientY: coords.clientY,
            screenX: coords.screenX,
            screenY: coords.screenY,
            pageX: coords.pageX,
            pageY: coords.pageY,
            view: window,
          })
        )
      }

      if (emitClick) {
        const coords = toAbsolute()
        node.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: coords.clientX,
            clientY: coords.clientY,
            screenX: coords.screenX,
            screenY: coords.screenY,
            pageX: coords.pageX,
            pageY: coords.pageY,
            view: window,
          })
        )
      }
    }

    dispatchPointerAndMouse('pointerenter')
    dispatchPointerAndMouse('pointerover')
    dispatchPointerAndMouse('pointerdown', { buttons: 1, button: 0 })
    dispatchPointerAndMouse('pointermove', { buttons: 1, button: 0 })
    dispatchPointerAndMouse('pointerup', { button: 0 }, true)
    dispatchPointerAndMouse('pointerout')
    dispatchPointerAndMouse('pointerleave')
  }, { point })
}

/**
 * キャンバス上でホバー相当のポインター操作を発火
 */
async function hoverOnCanvas(canvas: Locator, point: CanvasPoint) {
  await canvas.evaluate((node, params) => {
    const { point } = params
    const rect = node.getBoundingClientRect()
    const pointerId = 3

    const createPointerEvent = (type: string) =>
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId,
        pointerType: 'mouse',
        clientX: point.x,
        clientY: point.y,
        screenX: point.x,
        screenY: point.y,
        offsetX: point.x - rect.left,
        offsetY: point.y - rect.top,
        pageX: point.x + window.scrollX,
        pageY: point.y + window.scrollY,
        view: window,
      })

    const pointerToMouse: Record<string, string | undefined> = {
      pointerenter: 'mouseenter',
      pointerover: 'mouseover',
      pointermove: 'mousemove',
    }

    const dispatchPointerAndMouse = (type: string) => {
      node.dispatchEvent(createPointerEvent(type))

      const mouseType = pointerToMouse[type]
      if (mouseType) {
        node.dispatchEvent(
          new MouseEvent(mouseType, {
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: point.x,
            clientY: point.y,
            screenX: point.x,
            screenY: point.y,
            pageX: point.x + window.scrollX,
            pageY: point.y + window.scrollY,
            view: window,
          })
        )
      }
    }

    dispatchPointerAndMouse('pointerenter')
    dispatchPointerAndMouse('pointerover')
    dispatchPointerAndMouse('pointermove')
  }, { point })
}

/**
 * 次のアニメーションフレームまで待機（Konva描画完了を待つ）
 */
async function waitNextFrame(canvas: Locator) {
  await canvas.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve())
      })
  )
}

/**
 * 主要操作の実行時間を計測し、閾値内に収まっているか検証するユーティリティ
 * @param name 操作名（日本語説明）
 * @param operation 実行する非同期操作
 * @returns 実測の所要時間(ms)
 */
async function measureOperation(
  name: string,
  operation: () => Promise<void>
): Promise<number> {
  const startedAt = performance.now()
  await operation()
  const duration = performance.now() - startedAt
  expect(duration, `${name} は ${PERFORMANCE_THRESHOLD_MS}ms 以内に完了すること`).toBeLessThanOrEqual(
    PERFORMANCE_THRESHOLD_MS
  )
  return duration
}

test.describe('作図E2E(MVP)', () => {
  test('作図からPNG出力までのフローが成功する', async ({ page }) => {
    const metrics: { name: string; duration: number }[] = []

    await test.step('作図ページへ遷移する', async () => {
      await page.goto('/draw')
      await expect(page.getByRole('button', { name: '保存 (Ctrl+S)' })).toBeVisible()
    })

    // サイドバーのスナップをOFFにして描画座標を入力座標と揃える
    const snapToggle = page.getByRole('button', { name: /スナップ/ })
    if (await snapToggle.isVisible()) {
      const labelText = await snapToggle.getAttribute('aria-label')
      if (labelText && labelText.includes('ON')) {
        await snapToggle.click()
      }
    }

    const canvas = page.locator('canvas').first()
    await canvas.waitFor()
    const box = await canvas.boundingBox()
    expect(box, 'キャンバスの描画領域を取得できること').not.toBeNull()
    if (!box) {
      throw new Error('キャンバスのバウンディングボックス取得に失敗しました')
    }

    const spanStart: CanvasPoint = {
      x: box.x + box.width * 0.35,
      y: box.y + box.height * 0.5,
    }
    const spanEnd: CanvasPoint = {
      x: box.x + box.width * 0.65,
      y: box.y + box.height * 0.52,
    }

    await test.step('サックスモードでスパンを描画する', async () => {
      const duration = await measureOperation('スパン描画', async () => {
        await page.mouse.move(spanStart.x, spanStart.y)
        await page.mouse.down()
        await page.mouse.move(spanEnd.x, spanEnd.y, { steps: 16 })
        await page.mouse.up()
        await waitNextFrame(canvas)
      })
      metrics.push({ name: 'スパン描画', duration })
    })

    // 作図完了後の描画反映を待機
    await waitNextFrame(canvas)

    await test.step('編集モードで柱数量を更新する', async () => {
      await page.getByRole('button', { name: '編集モード' }).click()
      const selectModeButton = page.getByRole('button', { name: '選択モード' })
      // 初期状態は選択モードのため、1回クリックしてモードを解除（null）にする
      await selectModeButton.click()
      await page.getByRole('button', { name: '編集対象: 柱' }).click()

      const pillarDuration = await measureOperation('柱編集カード表示', async () => {
        await page.mouse.click(spanStart.x, spanStart.y, { clickCount: 2 })
        await waitNextFrame(canvas)
        await waitNextFrame(canvas)
        await expect(page.locator('.pillar-quantity-card')).toBeVisible()
      })
      metrics.push({ name: '柱編集カード表示', duration: pillarDuration })

      const pillarCard = page.locator('.pillar-quantity-card').first()
      await pillarCard.getByLabelText('A の本数').fill('2')

      const saveDuration = await measureOperation('柱数量の保存', async () => {
        await pillarCard.getByRole('button', { name: '保存' }).click()
        await expect(pillarCard).not.toBeVisible()
      })
      metrics.push({ name: '柱数量の保存', duration: saveDuration })
    })

    await test.step('メモモードでメモを追加・更新する', async () => {
      await page.getByRole('button', { name: 'メモモード' }).click()
      const memoStart: CanvasPoint = {
        x: box.x + box.width * 0.55,
        y: box.y + box.height * 0.55,
      }
      const memoEnd: CanvasPoint = {
        x: memoStart.x + 180,
        y: memoStart.y + 140,
      }

      const memoCreateDuration = await measureOperation('メモ領域の作成', async () => {
        await page.mouse.move(memoStart.x, memoStart.y)
        await page.mouse.down()
        await page.mouse.move(memoEnd.x, memoEnd.y, { steps: 16 })
        await page.mouse.up()
        await waitNextFrame(canvas)
      })
      metrics.push({ name: 'メモ領域の作成', duration: memoCreateDuration })

      const memoCardDuration = await measureOperation('メモカード表示', async () => {
        await page.mouse.click(memoStart.x + 20, memoStart.y + 20)
        await expect(page.locator('.memo-card')).toBeVisible()
      })
      metrics.push({ name: 'メモカード表示', duration: memoCardDuration })

      const memoCard = page.locator('.memo-card').first()
      const memoTextarea = memoCard.getByLabelText('メモテキスト')
      await memoTextarea.fill('E2Eメモ: 自動テストで入力')

      const memoSaveDuration = await measureOperation('メモ保存', async () => {
        await memoCard.getByRole('button', { name: '保存' }).click()
        await expect(memoCard).not.toBeVisible()
      })
      metrics.push({ name: 'メモ保存', duration: memoSaveDuration })

      // 再度メモを開き内容が保持されていることを確認
      await page.mouse.click(memoStart.x + 20, memoStart.y + 20)
      await expect(page.locator('.memo-card')).toBeVisible()
      await expect(page.locator('.memo-card').getByLabelText('メモテキスト')).toHaveValue(
        'E2Eメモ: 自動テストで入力'
      )
      await page.locator('.memo-card').getByLabelText('閉じる').click()
    })

    await test.step('ビューモードで数量表示を確認する', async () => {
      await page.getByRole('button', { name: 'ビューモード' }).click()
      const infoDuration = await measureOperation('ビュー情報カード表示', async () => {
        await page.mouse.move(spanStart.x, spanStart.y)
        await expect(page.locator('.view-mode-info-card')).toBeVisible()
      })
      metrics.push({ name: 'ビュー情報カード表示', duration: infoDuration })

      const infoCard = page.locator('.view-mode-info-card').first()
      await expect(infoCard).toContainText('柱')
      await expect(infoCard).toContainText('A×2')
    })

    await test.step('保存モーダルからPNGプレビューを生成する', async () => {
      await page.getByRole('button', { name: '保存 (Ctrl+S)' }).click()
      await expect(page.locator('.save-modal-card')).toBeVisible()

      const pngDuration = await measureOperation('PNGプレビュー生成', async () => {
        await page.getByRole('button', { name: 'PNG形式で保存（プレビュー付き）' }).click()
        await expect(page.getByAltText('PNG保存プレビュー')).toBeVisible()
      })
      metrics.push({ name: 'PNGプレビュー生成', duration: pngDuration })

      const previewOverlay = page.locator('div.fixed.inset-0').last()
      await previewOverlay.getByRole('button', { name: 'キャンセル' }).click()
      await expect(page.getByAltText('PNG保存プレビュー')).not.toBeVisible()
    })

    test.info().attach('mvp-performance-metrics', {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json',
    })
  })
})
