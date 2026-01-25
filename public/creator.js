// Creator Dashboard JavaScript

let currentUser = null;
let currentLinks = [];
let editingSlug = null;

// Check authentication status on load
async function checkAuth() {
  try {
    // Hide loading, show dashboard section initially
    document.getElementById('loadingSection').style.display = 'none';
    
    // Check Supabase session
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      // Redirect to login
      window.location.href = '/login.html';
      return;
    }
    
    // Bind session to backend
    const bindResult = await bindSessionToBackend();
    
    if (!bindResult.success) {
      console.error('Session binding failed:', bindResult.error);
      window.location.href = '/login.html';
      return;
    }
    
    // Fetch user data from backend
    const response = await fetch('/api/me', {
      credentials: 'same-origin'
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Server returned non-JSON response');
      window.location.href = '/login.html';
      return;
    }
    
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      showDashboard();
      loadLinks();
    } else {
      window.location.href = '/login.html';
    }
  } catch (error) {
    console.error('Auth check error:', error);
    window.location.href = '/login.html';
  }
}

// Show dashboard section
function showDashboard() {
  document.getElementById('loadingSection').style.display = 'none';
  document.getElementById('notAuthSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';
  document.getElementById('userNav').style.display = 'inline';
  document.getElementById('guestNav').style.display = 'none';
  document.getElementById('userEmail').textContent = currentUser.email;
  document.getElementById('totalBalance').textContent = `$${currentUser.balance.toFixed(2)}`;
}

// Helper function to safely parse JSON
async function safeFetch(url, options = {}) {
  try {
    // Always include credentials for same-origin requests
    options.credentials = 'same-origin';
    
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. API may be unavailable.');
    }
    
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    if (error.message.includes('non-JSON')) {
      throw error;
    }
    throw new Error('Network error. Please check your connection.');
  }
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  
  try {
    // Sign out from Supabase
    await signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  currentUser = null;
  currentLinks = [];
  window.location.href = '/index.html';
});

// Create link form handler
document.getElementById('createLinkForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    dest_url: document.getElementById('dest_url').value,
    ads_required: parseInt(document.getElementById('ads_required').value)
  };

  try {
    const result = await safeFetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (result.ok) {
      // Show success
      document.getElementById('linkResult').style.display = 'block';
      document.getElementById('createError').style.display = 'none';
      document.getElementById('generatedUrl').value = result.data.url;
      
      // Reset form
      document.getElementById('createLinkForm').reset();
      
      // Reload links list
      loadLinks();
      
      // Scroll to result
      document.getElementById('linkResult').scrollIntoView({ behavior: 'smooth' });
    } else {
      // Show error
      document.getElementById('createError').textContent = result.data.error || 'Failed to create link';
      document.getElementById('createError').style.display = 'block';
      document.getElementById('linkResult').style.display = 'none';
    }
  } catch (error) {
    console.error('Create link error:', error);
    document.getElementById('createError').textContent = error.message;
    document.getElementById('createError').style.display = 'block';
  }
});

// Copy button handler
document.getElementById('copyBtn').addEventListener('click', () => {
  const input = document.getElementById('generatedUrl');
  input.select();
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = 'Copy';
    }, 2000);
  });
});

// Load links
async function loadLinks() {
  const linksList = document.getElementById('linksList');
  const linksLoading = document.getElementById('linksLoading');
  
  linksLoading.style.display = 'block';
  linksList.innerHTML = '';

  try {
    const result = await safeFetch('/api/links');

    if (result.ok) {
      currentLinks = result.data.links;
      document.getElementById('totalLinks').textContent = currentLinks.length;
      
      if (currentLinks.length === 0) {
        linksList.innerHTML = '<p class="empty-state">No links created yet. Create your first link above!</p>';
      } else {
        linksList.innerHTML = currentLinks.map(link => `
          <div class="link-item">
            <div class="link-info">
              <div class="link-slug">/l/${link.slug}</div>
              <div class="link-dest">${link.dest_url}</div>
              <div class="link-meta">${link.ads_required} sponsor views required • Created ${new Date(link.created_at).toLocaleDateString()}</div>
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-small" onclick="copyLinkUrl('${link.slug}')">Copy</button>
              <button class="btn btn-small" onclick="editLink('${link.slug}')">Edit</button>
              <button class="btn btn-small" onclick="deleteLink('${link.slug}')" style="background: var(--error-color);">Delete</button>
            </div>
          </div>
        `).join('');
      }
    } else {
      document.getElementById('dashboardError').textContent = result.data.error || 'Failed to load links';
      document.getElementById('dashboardError').style.display = 'block';
    }
  } catch (error) {
    console.error('Load links error:', error);
    document.getElementById('dashboardError').textContent = error.message;
    document.getElementById('dashboardError').style.display = 'block';
  } finally {
    linksLoading.style.display = 'none';
  }
}

// Copy link URL helper
function copyLinkUrl(slug) {
  const url = `${window.location.origin}/l/${slug}`;
  navigator.clipboard.writeText(url).then(() => {
    alert('Link copied to clipboard!');
  });
}

// Edit link
function editLink(slug) {
  const link = currentLinks.find(l => l.slug === slug);
  if (!link) return;

  editingSlug = slug;
  document.getElementById('editDestUrl').value = link.dest_url;
  document.getElementById('editAdsRequired').value = link.ads_required;
  document.getElementById('editModal').style.display = 'flex';
}

// Cancel edit
document.getElementById('cancelEditBtn').addEventListener('click', () => {
  document.getElementById('editModal').style.display = 'none';
  editingSlug = null;
});

// Submit edit
document.getElementById('editLinkForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const dest_url = document.getElementById('editDestUrl').value;
  const ads_required = parseInt(document.getElementById('editAdsRequired').value);

  try {
    const result = await safeFetch(`/api/links/${editingSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dest_url, ads_required })
    });

    if (result.ok) {
      document.getElementById('editModal').style.display = 'none';
      editingSlug = null;
      loadLinks();
    } else {
      document.getElementById('editError').textContent = result.data.error || 'Failed to update link';
      document.getElementById('editError').style.display = 'block';
    }
  } catch (error) {
    console.error('Edit link error:', error);
    document.getElementById('editError').textContent = error.message;
    document.getElementById('editError').style.display = 'block';
  }
});

// Delete link
async function deleteLink(slug) {
  if (!confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
    return;
  }

  try {
    const result = await safeFetch(`/api/links/${slug}`, {
      method: 'DELETE'
    });

    if (result.ok) {
      loadLinks();
    } else {
      alert(result.data.error || 'Failed to delete link');
    }
  } catch (error) {
    console.error('Delete link error:', error);
    alert(error.message);
  }
}

// Initialize
checkAuth();
