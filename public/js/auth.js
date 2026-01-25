// Supabase Auth Client Setup
// This file provides Supabase authentication utilities for the frontend

// Note: Supabase client is loaded from CDN in HTML files
// This ensures supabase object is available globally

let supabaseClient = null;

// Initialize Supabase client
function initSupabase() {
  // Get Supabase config from window (set in HTML)
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error('Supabase configuration not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
    return null;
  }
  
  if (typeof supabase === 'undefined') {
    console.error('Supabase library not loaded. Please include the Supabase CDN script.');
    return null;
  }
  
  supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  return supabaseClient;
}

// Get current Supabase session
async function getSupabaseSession() {
  if (!supabaseClient) {
    supabaseClient = initSupabase();
  }
  
  if (!supabaseClient) return null;
  
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return session;
}

// Bind Supabase session to backend
async function bindSessionToBackend() {
  const session = await getSupabaseSession();
  
  if (!session || !session.access_token) {
    return { success: false, error: 'No active session' };
  }
  
  try {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      credentials: 'same-origin'
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { success: false, error: 'Server returned non-JSON response' };
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to bind session' };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Session binding error:', error);
    return { success: false, error: error.message };
  }
}

// Sign up with email and password
async function signUpWithEmail(email, password) {
  if (!supabaseClient) {
    supabaseClient = initSupabase();
  }
  
  if (!supabaseClient) {
    return { success: false, error: 'Supabase not initialized' };
  }
  
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Bind session to backend
  if (data.session) {
    const bindResult = await bindSessionToBackend();
    if (!bindResult.success) {
      return { success: false, error: bindResult.error };
    }
    return { success: true, user: data.user, session: data.session };
  }
  
  return { success: true, user: data.user, session: data.session };
}

// Sign in with email and password
async function signInWithEmail(email, password) {
  if (!supabaseClient) {
    supabaseClient = initSupabase();
  }
  
  if (!supabaseClient) {
    return { success: false, error: 'Supabase not initialized' };
  }
  
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Bind session to backend
  const bindResult = await bindSessionToBackend();
  if (!bindResult.success) {
    return { success: false, error: bindResult.error };
  }
  
  return { success: true, user: data.user, session: data.session };
}

// Sign out
async function signOut() {
  if (!supabaseClient) {
    supabaseClient = initSupabase();
  }
  
  if (!supabaseClient) {
    return { success: false, error: 'Supabase not initialized' };
  }
  
  const { error } = await supabaseClient.auth.signOut();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Also clear backend session
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin'
    });
  } catch (error) {
    console.error('Error clearing backend session:', error);
  }
  
  return { success: true };
}

// Check if user is authenticated
async function isAuthenticated() {
  const session = await getSupabaseSession();
  return session !== null;
}

// Get current user
async function getCurrentUser() {
  if (!supabaseClient) {
    supabaseClient = initSupabase();
  }
  
  if (!supabaseClient) return null;
  
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return user;
}
