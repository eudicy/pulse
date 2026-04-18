'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

interface Project {
  id: string
  name: string
}

interface GenerateReportFormProps {
  projects: Project[]
}

export function GenerateReportForm({ projects }: GenerateReportFormProps) {
  const router = useRouter()
  // scopeValue is either "TEAM" or the projectId string
  const [scopeValue, setScopeValue] = useState<string>('TEAM')
  const [periodStart, setPeriodStart] = useState<string>('')
  const [periodEnd, setPeriodEnd] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isProject = scopeValue !== 'TEAM'
  const selectedLabel =
    scopeValue === 'TEAM' ? 'Team' : (projects.find((p) => p.id === scopeValue)?.name ?? scopeValue)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/reports/stakeholder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: isProject ? 'PROJECT' : 'TEAM',
          projectId: isProject ? scopeValue : undefined,
          periodStart,
          periodEnd,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        let errorMsg = 'Failed to generate report'
        try {
          errorMsg = (JSON.parse(text) as { error?: string }).error ?? errorMsg
        } catch {
          errorMsg = text || errorMsg
        }
        setError(errorMsg)
        return
      }

      const data = (await res.json()) as { reportId: string }
      router.push(`/app/reports/stakeholder/${data.reportId}`)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Scope</label>
          <Select value={scopeValue} onValueChange={(v) => setScopeValue(v ?? 'TEAM')}>
            <SelectTrigger>
              <span className="flex-1 text-left">{selectedLabel}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TEAM">Team</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          {/* spacer for alignment */}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Period start</label>
          <Input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Period end</label>
          <Input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? 'Generating…' : 'Generate Report'}
      </Button>
    </form>
  )
}
