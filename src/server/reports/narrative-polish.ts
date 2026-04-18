import Anthropic from '@anthropic-ai/sdk'
import { dbRaw } from '@/src/lib/db-raw'
import { yearMonth } from '@/src/lib/time'

const INPUT_CENTS_PER_TOKEN = 0.00000025 * 100 // $0.25/MTok -> cents per token
const OUTPUT_CENTS_PER_TOKEN = 0.00000125 * 100 // $1.25/MTok -> cents per token
const TIMEOUT_MS = 3000

export async function polishNarrative(
  raw: string,
  teamId: string
): Promise<{ text: string; usedLlm: boolean }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { text: raw, usedLlm: false }
  }

  const budgetCents = Number(process.env.LLM_MONTHLY_BUDGET_CENTS ?? '500')
  const currentYearMonth = yearMonth()

  const usage = await dbRaw.llmUsage.findUnique({
    where: { teamId_yearMonth: { teamId, yearMonth: currentYearMonth } },
  })

  if (usage && usage.centsUsed >= budgetCents) {
    return { text: raw, usedLlm: false }
  }

  try {
    const client = new Anthropic({ apiKey })
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await client.messages.create(
        {
          model: 'claude-haiku-4-5',
          max_tokens: 512,
          messages: [
            {
              role: 'user',
              content: `Rewrite this project status narrative in professional, natural English for a stakeholder audience. Keep it under 3 sentences. Preserve all facts:\n\n${raw}`,
            },
          ],
        },
        { signal: controller.signal }
      )

      const textBlock = response.content.find((b) => b.type === 'text')
      const text = textBlock?.type === 'text' ? textBlock.text : raw

      // Cost in cents (approximate)
      const inputTokens = response.usage.input_tokens
      const outputTokens = response.usage.output_tokens
      const costCents = Math.ceil(
        inputTokens * INPUT_CENTS_PER_TOKEN +
          outputTokens * OUTPUT_CENTS_PER_TOKEN
      )
      const totalTokens = inputTokens + outputTokens

      await dbRaw.llmUsage.upsert({
        where: {
          teamId_yearMonth: { teamId, yearMonth: currentYearMonth },
        },
        create: {
          teamId,
          yearMonth: currentYearMonth,
          tokensUsed: totalTokens,
          centsUsed: costCents,
        },
        update: {
          tokensUsed: { increment: totalTokens },
          centsUsed: { increment: costCents },
        },
      })

      return { text, usedLlm: true }
    } finally {
      clearTimeout(timeout)
    }
  } catch {
    return { text: raw, usedLlm: false }
  }
}
