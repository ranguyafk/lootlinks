import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'You must be logged in to create links' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { title, dest_url, ads_required } = body

    // Validate required fields
    if (!dest_url) {
      return NextResponse.json(
        { error: 'Missing dest_url', details: 'Destination URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(dest_url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL', details: 'Please provide a valid URL' },
        { status: 400 }
      )
    }

    // Generate slug (with retry logic)
    const generateSlug = () => {
      const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
      let result = ""
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    let slug = generateSlug()
    let attempts = 0
    const maxAttempts = 5

    // Try to insert with retry on slug collision
    while (attempts < maxAttempts) {
      attempts++

      const payload = {
        user_id: user.id,
        slug,
        dest_url,
        title: title || null,
        ads_required: ads_required || 3,
        views: 0,
        completions: 0,
        is_active: true
      }

      const { data, error: insertError } = await supabase
        .from('links')
        .insert(payload)
        .select()
        .single()

      if (!insertError) {
        // Success!
        return NextResponse.json({ data }, { status: 201 })
      }

      // Handle slug collision
      if (insertError.code === '23505') {
        slug = generateSlug()
        continue
      }

      // Other error - return it
      return NextResponse.json(
        { 
          error: 'Database error', 
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        },
        { status: 500 }
      )
    }

    // Failed after max attempts
    return NextResponse.json(
      { error: 'Failed to generate unique slug', details: 'Please try again' },
      { status: 500 }
    )

  } catch (error: any) {
    console.error('[API /api/links] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
