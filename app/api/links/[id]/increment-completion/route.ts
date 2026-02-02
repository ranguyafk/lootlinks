import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()

    // First verify the link exists
    const { data: link, error: fetchError } = await supabase
      .from('links')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    // Use RPC for atomic increment to avoid race conditions
    // This performs: UPDATE links SET completions = completions + 1 WHERE id = link_id
    const { error: rpcError } = await supabase.rpc('increment_link_completion', {
      link_id: params.id
    })

    if (rpcError) {
      console.error('[API /api/links/[id]/increment-completion] RPC error:', rpcError)
      return NextResponse.json(
        { error: 'Failed to increment completion', details: rpcError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    console.error('[API /api/links/[id]/increment-completion] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
