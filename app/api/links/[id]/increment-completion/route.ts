import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch the link to verify it exists and get current completions count
    const { data: link, error } = await supabase
      .from('links')
      .select('id, completions')
      .eq('id', id)
      .single()

    if (error || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    // Increment completions count
    const { error: updErr } = await supabase
      .from('links')
      .update({ completions: link.completions + 1 })
      .eq('id', link.id)

    if (updErr) {
      return NextResponse.json(
        { error: 'Failed to increment completion', details: updErr.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: e.message },
      { status: 500 }
    )
  }
}
