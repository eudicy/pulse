import { requireSession } from '@/src/lib/auth-session'
import { dbRaw } from '@/src/lib/db-raw'
import { toMarkdown } from '@/src/server/reports/export/markdown'
import { buildStakeholderReportPdfElement } from '@/src/server/reports/export/pdf-doc'
import { renderToStream } from '@react-pdf/renderer'
import type { StakeholderReportContent } from '@/src/server/reports/stakeholder-generator'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession()
  const { id } = await params

  const report = await dbRaw.stakeholderReport.findFirst({
    where: { id, teamId: session.teamId },
    select: { id: true, content: true },
  })

  if (!report) {
    return new Response('report not found', { status: 404 })
  }

  const content = report.content as StakeholderReportContent
  const url = new URL(req.url)
  const format = url.searchParams.get('format') ?? 'md'

  if (format === 'md') {
    const markdown = toMarkdown(content)
    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="stakeholder-report-${id}.md"`,
      },
    })
  }

  if (format === 'pdf') {
    const pdfElement = buildStakeholderReportPdfElement(content)
    const nodeStream = await renderToStream(pdfElement)

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk))
        })
        nodeStream.on('end', () => {
          controller.close()
        })
        nodeStream.on('error', (err: Error) => {
          controller.error(err)
        })
      },
    })

    return new Response(webStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="stakeholder-report-${id}.pdf"`,
      },
    })
  }

  return new Response('unsupported format; use ?format=md or ?format=pdf', {
    status: 400,
  })
}
