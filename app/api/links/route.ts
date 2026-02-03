import { NextRequest, NextResponse } from "next/server"
import { CreateLinkSchema } from "@/lib/validation/link"
import { createClient } from "@/lib/supabase/server"

function randomSlug(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let out = ""
  for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length))
  return out
}

const isDev = process.env.NODE_ENV !== "production"

export async function POST(request: NextRequest) {
  // Step 1: Parse JSON body safely
  let body: unknown
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "BAD_JSON", details: isDev ? String(e) : undefined },
      { status: 400 }
    )
  }

  // Step 2: Validate input
  const parse = CreateLinkSchema.safeParse(body)
  if (!parse.success) {
    const first = parse.error.issues?.[0]
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: first ? `${first.path.join(".")}: ${first.message}` : undefined,
      },
      { status: 400 }
    )
  }
  const { title, dest_url, ads_required } = parse.data

  // Step 3: Supabase + auth
  let supabase
  try {
    supabase = await createClient()
  } catch (e) {
    return NextResponse.json(
      {
        error: "Database initialization failed",
        code: "DB_INIT_FAILED",
        details: isDev ? String(e) : undefined,
      },
      { status: 500 }
    )
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        code: "UNAUTHORIZED",
        details: isDev && authError ? authError.message : undefined,
      },
      { status: 401 }
    )
  }

  // Step 4: Try DB-side slug default first
  const basePayload = {
    user_id: user.id,
    dest_url,
    title,
    ads_required,
  }

  // Attempt insert without slug — works if DB has default generate_unique_slug()
  const firstTry = await supabase.from("links").insert(basePayload).select().single()

  // If worked — done
  if (!firstTry.error && firstTry.data) {
    return NextResponse.json({ data: firstTry.data }, { status: 201 })
  }

  // If the failure is clearly unrelated to slug default, return it
  const errCode = firstTry.error?.code
  const errMsg = firstTry.error?.message || ""
  const looksLikeSlugRequired =
    errCode === "23502" || /slug.*null|missing.*slug/i.test(firstTry.error?.details || "") || /slug/i.test(errMsg)

  if (!looksLikeSlugRequired) {
    return NextResponse.json(
      {
        error: "Insert failed",
        code: "INSERT_FAILED",
        details: isDev
          ? { code: firstTry.error?.code, message: firstTry.error?.message, details: firstTry.error?.details }
          : undefined,
      },
      { status: 500 }
    )
  }

  // Step 5: Fallback — generate slug in app with retries on unique violation
  const maxAttempts = 7
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const slug = randomSlug(8)
    const attemptRes = await supabase
      .from("links")
      .insert({ ...basePayload, slug })
      .select()
      .single()

    if (!attemptRes.error && attemptRes.data) {
      return NextResponse.json({ data: attemptRes.data }, { status: 201 })
    }

    const code = attemptRes.error?.code
    if (code !== "23505") {
      // Not a unique violation — return it
      return NextResponse.json(
        {
          error: "Insert failed",
          code: "INSERT_FAILED",
          details: isDev
            ? { code: attemptRes.error?.code, message: attemptRes.error?.message, details: attemptRes.error?.details }
            : undefined,
        },
        { status: 500 }
      )
    }
    // 23505: slug unique violation — retry
  }

  return NextResponse.json(
    { error: "Could not generate a unique slug", code: "SLUG_EXHAUSTED" },
    { status: 500 }
  )
}
