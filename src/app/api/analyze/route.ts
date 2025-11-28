// This file creates a new API route at /api/analyze

import { NextResponse } from 'next/server';
import { analyzeInput } from '@/app/actions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Call the existing server action
    const results = await analyzeInput(body);

    return NextResponse.json(results);
  } catch (error) {
    console.error('API Route Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
