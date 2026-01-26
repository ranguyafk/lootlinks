// Shared JavaScript utilities for LootLinks

/**
 * Toggle mobile menu visibility
 */
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) {
    menu.classList.toggle('active');
  }
}

/**
 * Toggle FAQ item
 * @param {HTMLElement} element - The FAQ question element that was clicked
 */
function toggleFaq(element) {
  const faqItem = element.parentElement;
  const isActive = faqItem.classList.contains('active');
  
  // Close all FAQ items
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Open clicked item if it wasn't already active
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { toggleMobileMenu, toggleFaq };
}
