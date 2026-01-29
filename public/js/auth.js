// Native Authentication Client
// This file provides authentication utilities using the backend API

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

// Sign up with email and password
async function signUp(email, password, honeypotValue = '') {
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
    
    return { success: true, user: data.user, session: { access_token: 'native' } };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: error.message };
  }
}

// Sign in with email and password
async function signIn(email, password) {
  // Check rate limit
  const rateLimit = await checkRateLimit('login');
  if (!rateLimit.allowed) {
    const minutes = Math.ceil((new Date(rateLimit.resetAt) - new Date()) / 60000);
    return { 
      success: false, 
      error: `Too many login attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` 
    };
  }
  
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
    
    return { success: true, user: data.user, session: { access_token: 'native' } };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// Sign out
async function signOut() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Check if user is authenticated
async function isAuthenticated() {
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
  try {
    const response = await fetch('/api/me', {
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}
