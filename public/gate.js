// Gate page logic for handling ad views and unlocking destination

let linkData = null;
let completedAds = new Set();
let placeholderAdContent = '';

// Extract slug from URL path
function getSlugFromPath() {
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1];
}

// Load placeholder ad content
async function loadPlaceholderContent() {
  try {
    const response = await fetch('/placeholder-ad.txt');
    placeholderAdContent = await response.text();
  } catch (error) {
    console.error('Error loading placeholder content:', error);
    placeholderAdContent = 'Thank you for supporting our creator!\n\nThis is a placeholder sponsor message.';
  }
}

// Fetch link metadata
async function fetchLinkMetadata(slug) {
  const response = await fetch(`/api/links/${slug}`);
  if (!response.ok) {
    throw new Error('Link not found');
  }
  return await response.json();
}

// Show error state
function showError(message) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('gateState').style.display = 'none';
  document.getElementById('errorState').style.display = 'block';
  document.getElementById('errorMessage').textContent = message;
}

// Create ad card element
function createAdCard(adIndex, adViewSeconds) {
  const card = document.createElement('div');
  card.className = 'ad-card';
  card.id = `ad-card-${adIndex}`;
  
  card.innerHTML = `
    <div class="ad-card-header">
      <span class="ad-number">Sponsor ${adIndex + 1}</span>
      <span class="ad-status" id="status-${adIndex}">⏳ Waiting</span>
    </div>
    <div class="ad-content" id="content-${adIndex}">
      <div class="ad-placeholder">Click "View Sponsor" to start</div>
    </div>
    <div class="ad-footer">
      <button class="btn btn-secondary" id="btn-${adIndex}" onclick="startAdView(${adIndex})">
        View Sponsor
      </button>
      <div class="ad-timer" id="timer-${adIndex}"></div>
    </div>
  `;
  
  return card;
}

// Start viewing an ad
async function startAdView(adIndex) {
  const slug = getSlugFromPath();
  const btn = document.getElementById(`btn-${adIndex}`);
  const content = document.getElementById(`content-${adIndex}`);
  const status = document.getElementById(`status-${adIndex}`);
  const timer = document.getElementById(`timer-${adIndex}`);
  
  // Disable button
  btn.disabled = true;
  btn.textContent = 'Viewing...';
  
  // Update status
  status.textContent = '👀 Viewing';
  status.className = 'ad-status status-viewing';
  
  // Show placeholder content
  content.innerHTML = `<div class="ad-content-text">${placeholderAdContent.replace(/\n/g, '<br>')}</div>`;
  
  // Record start on server
  try {
    await fetch('/api/ads/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, ad_index: adIndex })
    });
  } catch (error) {
    console.error('Error starting ad view:', error);
  }
  
  // Start countdown timer
  let remainingSeconds = linkData.ad_view_seconds;
  timer.textContent = `${remainingSeconds}s remaining`;
  
  const countdown = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds > 0) {
      timer.textContent = `${remainingSeconds}s remaining`;
    } else {
      clearInterval(countdown);
      completeAdView(adIndex);
    }
  }, 1000);
}

// Complete an ad view
async function completeAdView(adIndex) {
  const slug = getSlugFromPath();
  const btn = document.getElementById(`btn-${adIndex}`);
  const status = document.getElementById(`status-${adIndex}`);
  const timer = document.getElementById(`timer-${adIndex}`);
  
  // Record completion on server
  try {
    const response = await fetch('/api/ads/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, ad_index: adIndex })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Update status
      status.textContent = '✅ Completed';
      status.className = 'ad-status status-completed';
      timer.textContent = 'Thank you!';
      btn.style.display = 'none';
      
      // Track completion
      completedAds.add(adIndex);
      
      // Check if all ads are completed
      if (data.all_completed) {
        enableContinueButton();
      }
    }
  } catch (error) {
    console.error('Error completing ad view:', error);
  }
}

// Enable continue button
function enableContinueButton() {
  const continueBtn = document.getElementById('continueBtn');
  const continueMessage = document.getElementById('continueMessage');
  
  continueBtn.disabled = false;
  continueMessage.textContent = '🎉 All sponsor views completed! Click to continue.';
  continueMessage.className = 'continue-message success';
}

// Handle continue to destination
async function handleContinue() {
  const slug = getSlugFromPath();
  const continueBtn = document.getElementById('continueBtn');
  const continueMessage = document.getElementById('continueMessage');
  
  continueBtn.disabled = true;
  continueBtn.textContent = 'Please wait...';
  
  try {
    const response = await fetch('/api/continue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      continueMessage.textContent = '✅ Redirecting to destination...';
      continueMessage.className = 'continue-message success';
      
      // Redirect to destination
      setTimeout(() => {
        window.location.href = data.dest_url;
      }, 1000);
    } else {
      continueMessage.textContent = '❌ Error: ' + (data.error || 'Failed to continue');
      continueMessage.className = 'continue-message error';
      continueBtn.disabled = false;
      continueBtn.textContent = 'Continue to Destination';
    }
  } catch (error) {
    console.error('Error continuing:', error);
    continueMessage.textContent = '❌ Network error. Please try again.';
    continueMessage.className = 'continue-message error';
    continueBtn.disabled = false;
    continueBtn.textContent = 'Continue to Destination';
  }
}

// Initialize the gate page
async function initGate() {
  try {
    const slug = getSlugFromPath();
    
    // Load placeholder content
    await loadPlaceholderContent();
    
    // Fetch link metadata
    linkData = await fetchLinkMetadata(slug);
    
    // Hide loading, show gate
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('gateState').style.display = 'block';
    
    // Update header
    document.getElementById('totalAds').textContent = linkData.ads_required;
    
    // Create ad cards
    const container = document.getElementById('adCardsContainer');
    for (let i = 0; i < linkData.ads_required; i++) {
      const card = createAdCard(i, linkData.ad_view_seconds);
      container.appendChild(card);
    }
    
    // Set up continue button handler
    document.getElementById('continueBtn').addEventListener('click', handleContinue);
    
  } catch (error) {
    console.error('Initialization error:', error);
    showError(error.message || 'Failed to load link. The link may not exist or has expired.');
  }
}

// Start initialization when page loads
document.addEventListener('DOMContentLoaded', initGate);
