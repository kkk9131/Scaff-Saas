import { describe, it, expect } from 'vitest'

import {
  PILLAR_LEVEL_HEIGHT_MM,
  PILLAR_TYPE_HEIGHTS_MM,
  getPillarTypeHeightMm,
  computePillarLevelHeightMm,
  computePillarTotalHeightMm,
} from '@/lib/scaffold/pillar'

describe('pillar height utilities', () => {
  it('定数: 段あたり高さは1900mm', () => {
    expect(PILLAR_LEVEL_HEIGHT_MM).toBe(1900)
  })

  it('種別ごとの高さマッピングが仕様通り', () => {
    expect(PILLAR_TYPE_HEIGHTS_MM.A).toBe(3800)
    expect(PILLAR_TYPE_HEIGHTS_MM.C).toBe(1900)
    expect(PILLAR_TYPE_HEIGHTS_MM.D).toBe(950)
    expect(PILLAR_TYPE_HEIGHTS_MM.E).toBe(475)
    expect(PILLAR_TYPE_HEIGHTS_MM.G).toBe(130)
    expect(PILLAR_TYPE_HEIGHTS_MM.DG).toBe(1095)
    expect(PILLAR_TYPE_HEIGHTS_MM.EG).toBe(610)
    expect(PILLAR_TYPE_HEIGHTS_MM['C-47']).toBe(1230)
    expect(PILLAR_TYPE_HEIGHTS_MM.KD).toBe(910)
  })

  it('getPillarTypeHeightMmが正しく返す', () => {
    expect(getPillarTypeHeightMm('A')).toBe(3800)
    expect(getPillarTypeHeightMm('EG')).toBe(610)
  })

  it('computePillarLevelHeightMm: 段数×1900mm', () => {
    expect(computePillarLevelHeightMm(0)).toBe(0)
    expect(computePillarLevelHeightMm(1)).toBe(1900)
    expect(computePillarLevelHeightMm(3)).toBe(5700)
  })

  it('computePillarTotalHeightMm: (levels×1900)+jack', () => {
    expect(computePillarTotalHeightMm(0, 300)).toBe(300)
    expect(computePillarTotalHeightMm(1, 300)).toBe(2200)
    expect(computePillarTotalHeightMm(3, 350)).toBe(6050)
  })
})

