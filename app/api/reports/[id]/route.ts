import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reportId = parseInt(id, 10)
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const body = await req.json()
    const { resultText, resultJson } = body

    if (resultText === undefined) {
      return NextResponse.json({ error: 'resultText is required' }, { status: 400 })
    }

    const report = await prisma.aiReport.update({
      where: { id: reportId },
      data: {
        resultText,
        resultJson: resultJson ?? null,
      },
    })

    return NextResponse.json(report)
  } catch (err) {
    console.error('[PATCH /api/reports/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
