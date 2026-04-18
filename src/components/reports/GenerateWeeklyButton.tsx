'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface GenerateWeeklyButtonProps {
  className?: string
}

export function GenerateWeeklyButton({ className }: GenerateWeeklyButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/reports/weekly/generate', { method: 'POST' })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleGenerate} disabled={loading} className={className}>
      {loading ? 'Generating…' : 'Generate Now'}
    </Button>
  )
}
