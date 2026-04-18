import { requireSession } from '@/src/lib/auth-session'
import { dbRaw } from '@/src/lib/db-raw'
import { InviteForm } from './invite-form'

const TIMEZONES = Intl.supportedValuesOf('timeZone')

export default async function TeamSettingsPage() {
  const session = await requireSession()

  const [members, pendingInvites, team] = await Promise.all([
    dbRaw.user.findMany({
      where: { teamId: session.teamId },
      orderBy: { createdAt: 'asc' },
    }),
    dbRaw.invite.findMany({
      where: {
        teamId: session.teamId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    }),
    dbRaw.team.findUnique({ where: { id: session.teamId } }),
  ])

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your team, members, and invites.
        </p>
      </div>

      {/* Team info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Team</h2>
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div>
            <span className="text-sm text-muted-foreground">Name</span>
            <p className="font-medium">{team?.name}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Timezone</span>
            <p className="font-medium">{team?.timezone ?? 'UTC'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Change timezone</span>
            <select
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              defaultValue={team?.timezone ?? 'UTC'}
              disabled
              title="Timezone selector (read-only in MVP)"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Members */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Members</h2>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-sm">{member.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  member.role === 'ADMIN'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {member.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Pending Invites</h2>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {invite.expiresAt.toLocaleDateString()}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                  {invite.role}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Invite form — only admins can invite */}
      {session.role === 'ADMIN' && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Invite a Member</h2>
          <InviteForm />
        </section>
      )}
    </div>
  )
}
