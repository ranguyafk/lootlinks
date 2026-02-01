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
  const isDev = process.env.NODE_ENV === 'development'
  
  try {
    console.log('[API /api/links/create] Starting request')
    
    // Step 1: Parse body
    let body
    try {
      body = await request.json()
      if (isDev) {
        console.log('[API /api/links/create] Parsed body:', body)
      }
    } catch (e) {
      console.error('[API /api/links/create] Failed to parse body:', e)
      return NextResponse.json(
        { error: 'Invalid request body', details: isDev ? String(e) : undefined },
        { status: 400 }
      )
    }

    const { title, dest_url, ads_required } = body

    // Step 2: Validate URL
    if (!dest_url) {
      return NextResponse.json({ error: 'dest_url is required' }, { status: 400 })
    }

    try {
      new URL(dest_url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Step 3: Create Supabase client
    let supabase
    try {
      supabase = await createClient()
      console.log('[API /api/links/create] Supabase client created')
    } catch (e) {
      console.error('[API /api/links/create] Failed to create Supabase client:', e)
      return NextResponse.json(
        { error: 'Database connection failed', details: isDev ? String(e) : undefined },
        { status: 500 }
      )
    }

    // Step 4: Get authenticated user
    let user
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('[API /api/links/create] Auth error:', authError)
        return NextResponse.json(
          { error: 'Authentication failed', details: isDev ? authError.message : undefined },
          { status: 401 }
        )
      }

      if (!authUser) {
        console.error('[API /api/links/create] No user found')
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }

      user = authUser
      if (isDev) {
        console.log('[API /api/links/create] User authenticated:', user.id)
      }
    } catch (e) {
      console.error('[API /api/links/create] Failed to get user:', e)
      return NextResponse.json(
        { error: 'Failed to verify authentication', details: isDev ? String(e) : undefined },
        { status: 500 }
      )
    }

    // Step 5: Try to insert with retries
    const maxAttempts = 5
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const slug = generateSlug()
      
      console.log(`[API /api/links/create] Insert attempt ${attempt}/${maxAttempts} with slug:`, slug)

      const payload = {
        user_id: user.id,
        slug,
        dest_url,
        title: title || null,
        ads_required: ads_required || 3,
      }

      if (isDev) {
        console.log('[API /api/links/create] Payload:', payload)
      }

      try {
        const { data, error: insertError } = await supabase
          .from('links')
          .insert(payload)
          .select()
          .single()

        if (insertError) {
          console.error('[API /api/links/create] Insert error:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          })

          // Slug collision - retry
          if (insertError.code === '23505') {
            console.log('[API /api/links/create] Slug collision, retrying...')
            continue
          }

          // Detect schema cache issues
          const isSchemaIssue = insertError.message?.includes('schema cache') || 
                                insertError.message?.includes('column') && insertError.message?.includes('does not exist')
          
          if (isSchemaIssue) {
            console.error('[API /api/links/create] SCHEMA CACHE ISSUE DETECTED!')
            console.error('[API /api/links/create] This usually means PostgREST schema cache is out of sync.')
            console.error('[API /api/links/create] Solution: Run migration script 003_reload_schema_cache.sql in Supabase SQL Editor.')
          }

          // Build comprehensive error response
          const errorResponse: any = { 
            error: 'Database insert failed',
            code: insertError.code,
            hint: insertError.hint
          }

          if (isDev) {
            errorResponse.details = insertError.message
            errorResponse.attempted_payload = payload
            
            if (isSchemaIssue) {
              errorResponse.troubleshooting = {
                issue: 'Schema cache synchronization problem',
                cause: 'PostgREST schema cache does not reflect current database schema',
                solution: 'Run migration script: scripts/003_reload_schema_cache.sql',
                documentation: 'See scripts/README.md for details on schema cache management'
              }
            }
          }

          // Other error - return it
          return NextResponse.json(errorResponse, { status: 500 })
        }

        // Success!
        console.log('[API /api/links/create] Link created successfully')
        return NextResponse.json({ data }, { status: 200 })

      } catch (e) {
        console.error('[API /api/links/create] Unexpected error during insert:', e)
        return NextResponse.json(
          { error: 'Unexpected database error', details: isDev ? String(e) : undefined },
          { status: 500 }
        )
      }
    }

    // Failed after all retries
    console.error('[API /api/links/create] Failed after', maxAttempts, 'attempts')
    return NextResponse.json(
      { error: 'Failed to generate unique slug after multiple attempts' },
      { status: 500 }
    )

  } catch (error: any) {
    console.error('[API /api/links/create] Unexpected error:', error)
    if (isDev) {
      console.error('[API /api/links/create] Stack trace:', error.stack)
    }
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: isDev ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
