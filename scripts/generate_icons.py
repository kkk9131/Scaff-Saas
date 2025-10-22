#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
アイコン生成スクリプト
元画像から各サイズのアイコンファイルを自動生成します
"""

from PIL import Image
import os

# 元画像のパス
SOURCE_IMAGE = "/Users/kazuto/Desktop/scaff-saas.png"

# 出力先ディレクトリ
OUTPUT_DIR = "/Users/kazuto/Desktop/Scaff-SaaS/public"

# 生成するアイコンのサイズ定義
ICON_SIZES = {
    "favicon.ico": [(16, 16), (32, 32), (48, 48)],  # マルチサイズICO
    "icon-192.png": (192, 192),  # PWA用
    "icon-512.png": (512, 512),  # PWA用
    "apple-touch-icon.png": (180, 180),  # Apple Touch Icon
}

def create_directory(path):
    """ディレクトリが存在しない場合は作成"""
    if not os.path.exists(path):
        os.makedirs(path)
        print(f"✅ ディレクトリを作成: {path}")

def resize_image(img, size, resample=Image.Resampling.LANCZOS):
    """画像をリサイズ（アスペクト比を保持して中央配置）"""
    # 元画像のサイズ
    original_width, original_height = img.size
    target_width, target_height = size

    # アスペクト比を計算
    aspect = original_width / original_height
    target_aspect = target_width / target_height

    if aspect > target_aspect:
        # 横長の画像 - 幅を基準にリサイズ
        new_width = target_width
        new_height = int(target_width / aspect)
    else:
        # 縦長の画像 - 高さを基準にリサイズ
        new_height = target_height
        new_width = int(target_height * aspect)

    # リサイズ
    resized = img.resize((new_width, new_height), resample)

    # 透明背景の新規画像を作成
    result = Image.new('RGBA', size, (0, 0, 0, 0))

    # 中央に配置
    x = (target_width - new_width) // 2
    y = (target_height - new_height) // 2
    result.paste(resized, (x, y))

    return result

def generate_icons():
    """アイコンファイルを生成"""
    print("🎨 ScaffAIアイコン生成スクリプト")
    print("=" * 50)

    # 元画像を読み込み
    try:
        print(f"📂 元画像を読み込み中: {SOURCE_IMAGE}")
        source_img = Image.open(SOURCE_IMAGE)

        # RGBAモードに変換（透明度対応）
        if source_img.mode != 'RGBA':
            source_img = source_img.convert('RGBA')

        print(f"✅ 元画像サイズ: {source_img.size}")
    except FileNotFoundError:
        print(f"❌ エラー: 画像ファイルが見つかりません: {SOURCE_IMAGE}")
        return
    except Exception as e:
        print(f"❌ エラー: 画像の読み込みに失敗しました: {e}")
        return

    # 出力ディレクトリを作成
    create_directory(OUTPUT_DIR)

    # 各サイズのアイコンを生成
    print("\n🔧 アイコンを生成中...")

    for filename, sizes in ICON_SIZES.items():
        output_path = os.path.join(OUTPUT_DIR, filename)

        try:
            if filename.endswith('.ico'):
                # ICOファイル（マルチサイズ）
                icon_images = []
                for size in sizes:
                    resized = resize_image(source_img, size)
                    icon_images.append(resized)

                # ICO形式で保存
                icon_images[0].save(
                    output_path,
                    format='ICO',
                    sizes=[size for size in sizes]
                )
                print(f"✅ {filename} を生成 (サイズ: {sizes})")

            else:
                # PNG形式
                resized = resize_image(source_img, sizes)
                resized.save(output_path, format='PNG', optimize=True)
                print(f"✅ {filename} を生成 (サイズ: {sizes})")

        except Exception as e:
            print(f"❌ {filename} の生成に失敗: {e}")

    print("\n" + "=" * 50)
    print("🎉 アイコン生成が完了しました！")
    print(f"📁 出力先: {OUTPUT_DIR}")
    print("\n生成されたファイル:")
    print("  - favicon.ico (16x16, 32x32, 48x48)")
    print("  - icon-192.png (192x192)")
    print("  - icon-512.png (512x512)")
    print("  - apple-touch-icon.png (180x180)")

if __name__ == "__main__":
    generate_icons()
