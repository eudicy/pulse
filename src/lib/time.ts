import { DateTime } from 'luxon'

export interface WeeklyPeriod {
  periodStart: Date
  periodEnd: Date
}

/**
 * Computes the most recently completed Monday-to-Monday period in the team's timezone.
 * DST-safe: uses luxon startOf('week') which respects wall-clock time.
 */
export function weeklyPeriod(
  team: { timezone: string },
  now: DateTime = DateTime.now()
): WeeklyPeriod {
  const local = now.setZone(team.timezone)
  // startOf('week') in luxon is Monday 00:00 in the local zone
  const thisMonday = local.startOf('week')
  const lastMonday = thisMonday.minus({ weeks: 1 })

  return {
    periodStart: lastMonday.toUTC().toJSDate(),
    periodEnd: thisMonday.toUTC().toJSDate(),
  }
}

/**
 * Returns "YYYY-MM" string for the given date (used for LlmUsage yearMonth key).
 */
export function yearMonth(date: Date = new Date()): string {
  return DateTime.fromJSDate(date).toFormat('yyyy-MM')
}
