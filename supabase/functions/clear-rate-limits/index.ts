// =====================================================
// Supabase Edge Function: clear-rate-limits
// =====================================================
// Purpose: Clear rate limit entries for admins and E2E testing
//
// Security:
// - Admin mode: Requires valid license_key + admin passcode
// - E2E mode: Requires X-E2E-Test header with specific value
// - Only clears entries from the last 2 hours (not all historical data)
// - Logs all calls for audit trail
//
// Endpoints:
// - POST with license_key + passcode: Admin clear (requires admin role)
// - POST with X-E2E-Test header: E2E testing clear
// - GET with license_key + passcode: Get rate limit status (admin only)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-e2e-test',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Secret key for E2E tests - must match CI workflow
const E2E_TEST_KEY = 'myK9Q-e2e-test-2024'

interface AdminRequest {
  license_key: string
  passcode: string
  ip_address?: string  // Optional: clear specific IP only
}

interface RateLimitStatus {
  ip_address: string
  failed_attempts: number
  last_attempt: string
  is_blocked: boolean
  blocked_until: string | null
}

// Validate admin passcode against license key
function validateAdminPasscode(licenseKey: string, passcode: string): boolean {
  if (!licenseKey || !passcode) return false

  const parts = licenseKey.split('-')
  if (parts.length !== 4) return false

  // Admin passcode is 'a' + first 4 chars of parts[1]
  const expectedPasscode = `a${parts[1].slice(0, 4)}`
  return passcode.toLowerCase() === expectedPasscode.toLowerCase()
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // GET: Return rate limit status (admin only)
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const licenseKey = url.searchParams.get('license_key')
      const passcode = url.searchParams.get('passcode')

      if (!licenseKey || !passcode) {
        return new Response(
          JSON.stringify({ error: 'Missing license_key or passcode' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify admin access
      const { data: shows } = await supabaseClient
        .from('shows')
        .select('license_key')
        .eq('license_key', licenseKey)
        .single()

      if (!shows || !validateAdminPasscode(licenseKey, passcode)) {
        console.log('[ClearRateLimits] Unauthorized GET - invalid credentials')
        return new Response(
          JSON.stringify({ error: 'Unauthorized', message: 'Invalid admin credentials' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get rate limit status
      const { data: statusData, error: statusError } = await supabaseClient
        .rpc('admin_get_rate_limit_status', { p_hours_back: 2 })

      if (statusError) {
        console.error('[ClearRateLimits] Status query error:', statusError)
        return new Response(
          JSON.stringify({ error: 'Database error', details: statusError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const blockedIPs = (statusData as RateLimitStatus[] || []).filter(s => s.is_blocked)
      console.log(`[ClearRateLimits] Status check: ${statusData?.length || 0} IPs with failures, ${blockedIPs.length} blocked`)

      return new Response(
        JSON.stringify({
          success: true,
          rate_limits: statusData || [],
          blocked_count: blockedIPs.length,
          total_with_failures: statusData?.length || 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST: Clear rate limits
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for E2E test header first
    const e2eHeader = req.headers.get('x-e2e-test')
    if (e2eHeader === E2E_TEST_KEY) {
      // E2E test mode - clear all recent entries
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabaseClient
        .from('login_attempts')
        .delete()
        .gte('attempted_at', twoHoursAgo)
        .select('id')

      if (error) {
        console.error('[ClearRateLimits] E2E delete error:', error)
        return new Response(
          JSON.stringify({ error: 'Database error', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const deletedCount = data?.length ?? 0
      console.log(`[ClearRateLimits] E2E cleared ${deletedCount} rate limit entries`)

      return new Response(
        JSON.stringify({
          success: true,
          message: `Cleared ${deletedCount} rate limit entries`,
          deleted_count: deletedCount
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Admin mode - requires license_key and admin passcode
    const body: AdminRequest = await req.json()
    const { license_key, passcode, ip_address } = body

    if (!license_key || !passcode) {
      return new Response(
        JSON.stringify({ error: 'Missing license_key or passcode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the license key exists
    const { data: shows } = await supabaseClient
      .from('shows')
      .select('license_key')
      .eq('license_key', license_key)
      .single()

    if (!shows) {
      console.log('[ClearRateLimits] Invalid license key')
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid license key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify admin passcode
    if (!validateAdminPasscode(license_key, passcode)) {
      console.log('[ClearRateLimits] Invalid admin passcode')
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clear rate limits using the database function
    const { data: clearData, error: clearError } = await supabaseClient
      .rpc('admin_clear_rate_limits', {
        p_ip_address: ip_address || null,
        p_hours_back: 2
      })

    if (clearError) {
      console.error('[ClearRateLimits] Admin clear error:', clearError)
      return new Response(
        JSON.stringify({ error: 'Database error', details: clearError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = clearData?.[0] || { deleted_count: 0, message: 'No entries cleared' }
    console.log(`[ClearRateLimits] Admin clear: ${result.message}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        deleted_count: result.deleted_count
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ClearRateLimits] Edge Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

console.log('clear-rate-limits Edge Function loaded (v2 with admin support)')
