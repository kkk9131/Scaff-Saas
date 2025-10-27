#!/usr/bin/env node
/**
 * UIデフォ同期スクリプト（ドライラン対応）
 *
 * 目的:
 * - 既存のTSXファイルから、UIデフォ方針へ安全に近づける軽量整形を行う
 *   1) 透明ガラスカード: backdrop-blur を含むラッパーに `glass-scope` を付与
 *   2) 主要CTAのグラデ: 既存の from-primary/to-accent などを Aurora グラデへ置換
 *
 * 使い方:
 *   ドライラン: node scripts/sync-ui-defaults.mjs --dry
 *   反映      : node scripts/sync-ui-defaults.mjs --write
 */

import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const targetDir = path.join(repoRoot, 'frontend', 'src')

const DRY = process.argv.includes('--dry') || !process.argv.includes('--write')

/**
 * 対象拡張子
 */
const exts = new Set(['.tsx'])

/**
 * Aurora グラデのクラス
 */
const AURORA = {
  add:
    'bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:from-emerald-400/90 hover:via-cyan-400/90 hover:to-indigo-500/90 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-cyan-500/30 focus-visible:ring-emerald-300',
}

/**
 * CTAクラス置換ルール（左⇒右）
 */
const CTA_REPLACERS = [
  [
    /bg-gradient-to-r\s+from-primary\s+to-accent[\w\s:/-]*?/g,
    AURORA.add,
  ],
  [
    /bg-gradient-to-r\s+from-\[[^\]]+\]\s+to-\[[^\]]+\][\w\s:/-]*?/g,
    AURORA.add,
  ],
]

/**
 * glass-scope 付与: className="...backdrop-blur..." に glass-scope が無ければ付与
 */
function addGlassScope(source) {
  return source.replace(
    /(className=\{?\s*["'`][^"'`]*backdrop-blur[^"'`]*["'`]\s*\}?)/g,
    (m) => {
      if (/glass-scope/.test(m)) return m
      return m.replace(/className=\{?\s*["'`]/, (p) => p + 'glass-scope ')
    }
  )
}

/**
 * CTAの Aurora 化
 */
function replaceCtaClasses(source) {
  let out = source
  for (const [from, to] of CTA_REPLACERS) {
    out = out.replace(from, (m) => {
      // すでにAuroraっぽければスキップ
      if (/from-emerald-400/.test(m) && /to-indigo-500/.test(m)) return m
      return to
    })
  }
  return out
}

/** 走査 */
function walk(dir) {
  const ents = fs.readdirSync(dir, { withFileTypes: true })
  for (const ent of ents) {
    const fp = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      walk(fp)
    } else if (exts.has(path.extname(ent.name))) {
      processFile(fp)
    }
  }
}

const summary = []

function processFile(filePath) {
  const before = fs.readFileSync(filePath, 'utf8')
  let after = before
  after = addGlassScope(after)
  after = replaceCtaClasses(after)

  if (after !== before) {
    summary.push(filePath)
    if (!DRY) {
      fs.writeFileSync(filePath, after, 'utf8')
    }
  }
}

console.log(`[UI Sync] target = ${targetDir}`)
walk(targetDir)

if (summary.length === 0) {
  console.log('[UI Sync] 変更はありません。')
} else {
  console.log(`[UI Sync] 変更ファイル数: ${summary.length}`)
  for (const f of summary) console.log(' -', path.relative(repoRoot, f))
  if (DRY) {
    console.log('\n[UI Sync] ドライランです。--write を付けて反映できます。')
  } else {
    console.log('\n[UI Sync] 反映しました。')
  }
}

