'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface RevokeShareLinkButtonProps {
  reportId: string
}

export function RevokeShareLinkButton({ reportId }: RevokeShareLinkButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRevoke() {
    if (!confirm('Revoke the share link? Anyone with the current link will lose access.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/stakeholder/${reportId}/revoke`, { method: 'POST' })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleRevoke} disabled={loading}>
      {loading ? 'Revoking…' : 'Revoke Link'}
    </Button>
  )
}
