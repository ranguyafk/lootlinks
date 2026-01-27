// Supabase Auth Client Setup
// This file provides Supabase authentication utilities for the frontend

// Note: Supabase client is loaded from CDN in HTML files
// This ensures supabase object is available globally

let supabaseClient = null;

// Rate limiting helper
async function checkRateLimit(action) {
  try {
    const response = await fetch('/api/auth/check-rate-limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow the action if rate limit check fails
    return { allowed: true };
  }
}

// Honeypot validation
function validateHoneypot(honeypotValue) {
  // Honeypot should be empty (bots will fill it)
  return !honeypotValue || honeypotValue === '';
}

// Password validation
function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  return { valid: true };
}

// Initialize Supabase client
function initSupabase() {
  // Get Supabase config from window (set in HTML)
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.warn('Supabase configuration not found in environment variables.');
    return null;
  }
  
  // Check if Supabase library is loaded
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.warn('Supabase library not loaded from CDN. This may be due to ad blockers or network restrictions.');
    return null;
  }
  
  try {
    supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    return supabaseClient;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return null;
  }
}

// Show configuration error to user (removed - handled by fallback)
function showConfigError() {
  // Silently handle - app will use fallback authentication
  console.info('Using fallback authentication mode.');
}

// Get current Supabase session
async function getSupabaseSession() {
  if (!supabaseClient) {
    supabaseClient = initSupabase();
  }
  
  if (!supabaseClient) return null;
  
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Exception getting session:', error);
    return null;
  }
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
async function signUpWithEmail(email, password, honeypotValue = '') {
  // Check honeypot
  if (!validateHoneypot(honeypotValue)) {
    return { success: false, error: 'Invalid form submission' };
  }
  
  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }
  
  // Check rate limit
  const rateLimit = await checkRateLimit('signup');
  if (!rateLimit.allowed) {
    const minutes = Math.ceil((new Date(rateLimit.resetAt) - new Date()) / 60000);
    return { 
      success: false, 
      error: `Too many signup attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` 
    };
  }
  
  if (!supabaseClient) {
    supabaseClient = initSupabase();
  }
  
  if (!supabaseClient) {
    // Fallback: Use legacy backend authentication
    console.info('Using legacy backend authentication for signup');
    return await legacySignUp(email, password);
  }
  
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password
    });
    
    if (error) {
      // Provide more user-friendly error messages
      let errorMessage = error.message;
      if (errorMessage.includes('already registered')) {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (errorMessage.includes('password')) {
        errorMessage = 'Password must be at least 8 characters long.';
      }
      return { success: false, error: errorMessage };
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
  } catch (error) {
    console.error('Supabase signup error:', error);
    // Fallback to legacy
    return await legacySignUp(email, password);
  }
}

// Legacy backend signup fallback
async function legacySignUp(email, password) {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Signup failed' };
    }
    
    return { success: true, user: data.user, session: { access_token: 'legacy' } };
  } catch (error) {
    console.error('Legacy signup error:', error);
    return { success: false, error: error.message };
  }
}

// Sign in with email and password
async function signInWithEmail(email, password) {
  // Check rate limit
  const rateLimit = await checkRateLimit('login');
  if (!rateLimit.allowed) {
    const minutes = Math.ceil((new Date(rateLimit.resetAt) - new Date()) / 60000);
    return { 
      success: false, 
      error: `Too many login attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` 
    };
  }
  
  if (!supabaseClient) {
    supabaseClient = initSupabase();
  }
  
  if (!supabaseClient) {
    // Fallback: Use legacy backend authentication
    console.info('Using legacy backend authentication for signin');
    return await legacySignIn(email, password);
  }
  
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      // Provide more user-friendly error messages
      let errorMessage = error.message;
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before logging in.';
      }
      return { success: false, error: errorMessage };
    }
    
    // Bind session to backend
    const bindResult = await bindSessionToBackend();
    if (!bindResult.success) {
      return { success: false, error: bindResult.error };
    }
    
    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    console.error('Supabase signin error:', error);
    // Fallback to legacy
    return await legacySignIn(email, password);
  }
}

// Legacy backend signin fallback
async function legacySignIn(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Login failed' };
    }
    
    return { success: true, user: data.user, session: { access_token: 'legacy' } };
  } catch (error) {
    console.error('Legacy signin error:', error);
    return { success: false, error: error.message };
  }
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
  // Try Supabase first
  const session = await getSupabaseSession();
  if (session !== null) return true;
  
  // Fallback: check backend session
  try {
    const response = await fetch('/api/me', {
      credentials: 'same-origin'
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
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
