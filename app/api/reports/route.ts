import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const reports = await prisma.aiReport.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(reports)
  } catch (err) {
    console.error('[GET /api/reports]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { weekStart, promptText, resultText, resultJson } = body

    if (!weekStart || !promptText) {
      return NextResponse.json({ error: 'Missing required fields: weekStart, promptText' }, { status: 400 })
    }

    const report = await prisma.aiReport.create({
      data: {
        weekStart: new Date(weekStart),
        promptText,
        resultText: resultText ?? null,
        resultJson: resultJson ?? null,
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (err) {
    console.error('[POST /api/reports]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
