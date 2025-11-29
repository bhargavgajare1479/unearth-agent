// This file creates a new API route at /api/analyze

import { NextResponse } from 'next/server';
import { analyzeInput } from '@/app/actions';

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Call the existing server action
    console.log('API: Received request', { type: body.type, action: body.action });

    if (body.action === 'translate') {
      const { translateSummary } = await import('@/app/actions');
      const translation = await translateSummary({
        summary: body.summary,
        targetLanguage: body.targetLanguage
      });
      return NextResponse.json({ success: true, translatedSummary: translation.translatedSummary }, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (body.action === 'vote') {
      const { voteOnReport } = await import('@/app/actions');
      const result = await voteOnReport(body.reportId, body.vote);
      return NextResponse.json({ success: true, votes: result }, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const results = await analyzeInput(body);

    return NextResponse.json(results, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('API Route Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
