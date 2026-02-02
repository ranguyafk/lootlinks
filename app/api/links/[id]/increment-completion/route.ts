import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()

    // Fetch the link to ensure it exists and get current completion count
    const { data: link, error } = await supabase
      .from('links')
      .select('id, completions')
      .eq('id', params.id)
      .single()

    if (error || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    // Atomically increment the completion count
    const { error: updErr } = await supabase
      .from('links')
      .update({ completions: link.completions + 1 })
      .eq('id', link.id)

    if (updErr) {
      console.error('[API /api/links/[id]/increment-completion] Update error:', updErr)
      return NextResponse.json(
        { error: 'Failed to increment completion', details: updErr.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    console.error('[API /api/links/[id]/increment-completion] Unexpected error:', e)
    return NextResponse.json(
      { error: 'Internal server error', details: e.message },
      { status: 500 }
    )
  }
}
