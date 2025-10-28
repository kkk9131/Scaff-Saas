/**
 * キャンバス描画色のユーティリティ関数
 * ライト/ダークモードに応じて色を変換する
 */

/**
 * キャンバス描画用の色を取得
 * ライトモード時は白→黒に変換、その他はそのまま
 *
 * @param color - 元の色（'white' | 'red' | 'blue' | 'green'）
 * @param isDark - ダークモードかどうか
 * @returns Konvaで使用する色コード
 */
export function getCanvasColor(
  color: 'white' | 'red' | 'blue' | 'green',
  isDark: boolean
): string {
  // ライトモードで白色の場合は黒に変換
  if (!isDark && color === 'white') {
    return '#000000'; // 黒色
  }

  // それ以外は色マップから取得
  const colorMap: Record<'white' | 'red' | 'blue' | 'green', string> = {
    white: '#FFFFFF', // 白色（ダークモード用）
    red: '#EF4444', // 赤色
    blue: '#3B82F6', // 青色
    green: '#10B981', // 緑色
  };

  return colorMap[color];
}
