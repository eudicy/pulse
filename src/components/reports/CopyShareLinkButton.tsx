'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CopyShareLinkButtonProps {
  url: string
}

export function CopyShareLinkButton({ url }: CopyShareLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: prompt
      window.prompt('Copy this link:', url)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? 'Copied!' : 'Copy Share Link'}
    </Button>
  )
}
