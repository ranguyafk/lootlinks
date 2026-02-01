import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { title, dest_url, ads_required } = body

    // Validate URL
    try {
      new URL(dest_url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Try to insert with retries
    for (let i = 0; i < 5; i++) {
      const slug = generateSlug()
      
      const { data, error } = await supabase
        .from('links')
        .insert({
          user_id: user.id,
          slug,
          dest_url,
          title: title || null,
          ads_required: ads_required || 3,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') continue // Slug collision, retry
        console.error('Insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data }, { status: 200 })
    }

    return NextResponse.json({ error: 'Failed to create unique slug' }, { status: 500 })

  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
