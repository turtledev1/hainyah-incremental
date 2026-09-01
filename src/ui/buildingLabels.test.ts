import { describe, expect, it } from 'vitest'
import { CONTENT_REGISTRY } from '../game/content'
import { i18n } from '../i18n'
import { describeWorkerContribution, workerRole } from './buildingLabels'

const translate = i18n.t.bind(i18n)

function describe_(buildingId: string, outputPerWorker = 0): readonly string[] {
  const building = CONTENT_REGISTRY.buildingsById.get(buildingId as never)!
  return describeWorkerContribution(building, CONTENT_REGISTRY, outputPerWorker, translate)
}

describe('what a building tells the player about its workers', () => {
  it('explains that a barracks worker makes room for soldiers rather than being one', () => {
    expect(describe_('barracks')).toEqual(['Each drill-master makes room for 6 soldiers'])
  })

  it('explains the same for the guild in its own words', () => {
    expect(describe_('thievesGuild')).toEqual(['Each fence makes room for 3 thieves'])
  })

  it('states a house capacity per building, since a house takes no workers', () => {
    expect(describe_('house')).toEqual(['Houses 4 citizens'])
  })

  it('states what each worker in a producing building actually brings in', () => {
    expect(describe_('quarry', 0.2)).toEqual(['+0.2/s Stone for each of its quarriers'])
  })

  it('names the role rather than calling everyone a worker', () => {
    const roles = CONTENT_REGISTRY.buildings
      .filter((building) => building.workerSlotsPerBuilding > 0)
      .map((building) => workerRole(building, translate))

    expect(roles).not.toContain('workers')
    expect(roles).toContain('drill-masters')
    expect(roles).toContain('priests')
  })

  it('has something to say about every building that takes workers', () => {
    for (const building of CONTENT_REGISTRY.buildings) {
      if (building.workerSlotsPerBuilding === 0) {
        continue
      }
      const described = describeWorkerContribution(building, CONTENT_REGISTRY, 1, translate)
      expect(described.length).toBeGreaterThan(0)
      expect(described.join(' ')).not.toContain('buildings.')
    }
  })
})
