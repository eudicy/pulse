import { describe, it, expect } from 'vitest'
import { DateTime } from 'luxon'
import { weeklyPeriod } from '@/src/lib/time'

describe('weeklyPeriod', () => {
  it('returns Monday-to-Monday period for a Wednesday in America/Los_Angeles (pre spring-forward)', () => {
    // 2024-03-13 is a Wednesday; spring-forward was 2024-03-10 (already passed)
    // Use a fixed Wednesday before spring-forward to test DST boundary
    // 2024-03-06 is Wednesday before spring-forward (2024-03-10)
    const wednesday = DateTime.fromISO('2024-03-06T15:00:00', {
      zone: 'America/Los_Angeles',
    })
    const team = { timezone: 'America/Los_Angeles' }
    const { periodStart, periodEnd } = weeklyPeriod(team, wednesday)

    // Should be the previous Monday (2024-02-26) to this Monday (2024-03-04)
    const start = DateTime.fromJSDate(periodStart).setZone('America/Los_Angeles')
    const end = DateTime.fromJSDate(periodEnd).setZone('America/Los_Angeles')

    expect(start.weekday).toBe(1) // Monday
    expect(end.weekday).toBe(1)   // Monday
    expect(start.toISODate()).toBe('2024-02-26')
    expect(end.toISODate()).toBe('2024-03-04')
    // period is exactly 7 days
    expect(end.diff(start, 'days').days).toBe(7)
  })

  it('period boundaries are 7 wall-clock days apart after spring-forward (2024-03-17)', () => {
    // 2024-03-17 is a Sunday, after spring-forward on 2024-03-10
    const sunday = DateTime.fromISO('2024-03-17T12:00:00', {
      zone: 'America/Los_Angeles',
    })
    const team = { timezone: 'America/Los_Angeles' }
    const { periodStart, periodEnd } = weeklyPeriod(team, sunday)

    const start = DateTime.fromJSDate(periodStart).setZone('America/Los_Angeles')
    const end = DateTime.fromJSDate(periodEnd).setZone('America/Los_Angeles')

    expect(start.weekday).toBe(1)
    expect(end.weekday).toBe(1)
    // 7 wall-clock days apart
    expect(end.diff(start, 'days').days).toBe(7)
    // weeklyPeriod returns the PREVIOUS completed week.
    // On 2024-03-17 (Sunday), thisMonday = 2024-03-11, lastMonday = 2024-03-04.
    // The period 2024-03-04 → 2024-03-11 spans the DST boundary (spring-forward 2024-03-10).
    expect(start.toISODate()).toBe('2024-03-04')
    expect(end.toISODate()).toBe('2024-03-11')
  })

  it('UTC team: period boundaries are same in local and UTC', () => {
    const wednesday = DateTime.fromISO('2024-03-13T10:00:00', { zone: 'UTC' })
    const team = { timezone: 'UTC' }
    const { periodStart, periodEnd } = weeklyPeriod(team, wednesday)

    // In UTC, no offset — so toJSDate UTC values should equal local wall-clock midnight
    const startUTC = DateTime.fromJSDate(periodStart, { zone: 'UTC' })
    const endUTC = DateTime.fromJSDate(periodEnd, { zone: 'UTC' })

    expect(startUTC.hour).toBe(0)
    expect(startUTC.minute).toBe(0)
    expect(endUTC.hour).toBe(0)
    expect(endUTC.minute).toBe(0)
    expect(startUTC.weekday).toBe(1)
    expect(endUTC.weekday).toBe(1)
    expect(endUTC.diff(startUTC, 'days').days).toBe(7)
  })
})
