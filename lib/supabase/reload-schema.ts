'use server'

import { createClient } from '@/lib/supabase/server'

export async function reloadSchemaCache(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Execute the NOTIFY command to reload PostgREST schema cache
    const { error } = await supabase.rpc('reload_schema_cache')
    
    if (error) {
      console.error('[ReloadSchema] Failed to reload schema cache:', error)
      return { success: false, error: error.message }
    }
    
    console.log('[ReloadSchema] Schema cache reload notification sent successfully')
    return { success: true }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    console.error('[ReloadSchema] Unexpected error:', errorMessage)
    return { success: false, error: errorMessage }
  }
}
