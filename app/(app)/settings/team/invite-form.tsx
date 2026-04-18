'use client'

import { useState } from 'react'
import { inviteMember } from '@/src/server/teams/invite-member'

export function InviteForm() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setResult(null)
    const res = await inviteMember({ email, role })
    setResult(res)
    setPending(false)
    if (res.success) {
      setEmail('')
      setRole('MEMBER')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border p-4 space-y-4">
      <div className="space-y-1">
        <label htmlFor="invite-email" className="text-sm font-medium">
          Email address
        </label>
        <input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@example.com"
          className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="invite-role" className="text-sm font-medium">
          Role
        </label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MEMBER')}
          className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {result && (
        <p
          className={`text-sm ${result.success ? 'text-green-600' : 'text-destructive'}`}
        >
          {result.success ? 'Invite sent successfully.' : (result.error ?? 'Something went wrong.')}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Send Invite'}
      </button>
    </form>
  )
}
