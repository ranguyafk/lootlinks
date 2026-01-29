# LootLinks Design System

## Overview
LootLinks has been redesigned with a modern work.ink-inspired aesthetic featuring:
- **Primary Color**: Yellow/Gold (#FFD500)
- **Background**: Dark grey/charcoal (#1a1a1a, #2a2a2a)
- **Text**: White/light grey on dark backgrounds
- **Accents**: Yellow highlights and buttons

## Color Palette

### Primary Colors
- `--primary-color`: #FFD500 (Yellow)
- `--primary-hover`: #FFC700
- `--primary-light`: #FFE566
- `--primary-dark`: #E6C000

### Background Colors
- `--bg-base`: #1a1a1a (Main background)
- `--bg-elevated`: #2a2a2a (Elevated surfaces)
- `--bg-canvas`: #1f1f1f (Canvas areas)

### Text Colors
- `--text-primary`: #ffffff (White)
- `--text-secondary`: #d1d5db (Light grey)
- `--text-tertiary`: #9ca3af (Medium grey)
- `--text-muted`: #6b7280 (Muted grey)
- `--text-inverse`: #1a1a1a (Dark text for yellow backgrounds)

## Typography
- **Font Family**: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'SF Pro Display', Roboto
- **Headings**: Bold, large weights (700-800)
- **Body**: Regular weight (400) with good line-height (1.65)

## Components

### Navigation Bar
- Fixed/sticky at top of all pages
- Logo on left (🔗 LootLinks)
- Navigation links in center (Home, Features, Pricing, Dashboard)
- Auth buttons on right (Login, Sign Up)
- Mobile responsive with hamburger menu
- Dark background with yellow accents

### Footer
- Multi-column layout (4 columns)
- Sections: Product, Resources, Company, Connect
- Yellow section headers
- Dark background matching navbar
- Legal links and copyright at bottom

### Buttons
- **Primary**: Yellow gradient background with dark text
- **Secondary**: Glassmorphic dark background with light text
- **Hover effects**: Slight scale and shadow increase
- **Transitions**: Smooth 250ms animations

### Cards
- Dark grey backgrounds with subtle borders
- Hover effects with yellow border highlights
- Rounded corners (12-20px)
- Subtle shadows and glow effects

## Pages

### Homepage (/)
- Hero section with gradient text
- Stats/social proof section (3 cards)
- How it works section (4 steps)
- Testimonials (3 cards)
- Pricing section (3 tiers)
- FAQ section (8 questions)
- Final CTA section

### Features (/features.html)
- Detailed feature breakdown
- 6 major features with icons
- Alternating left/right layout
- Image placeholders for screenshots
- Final CTA

### Pricing (/pricing.html)
- 3 pricing tiers (Free, Pro, Enterprise)
- Detailed comparison table
- FAQ section
- Final CTA

### Creator Dashboard (/creator.html)
- Quick stats cards (4 metrics)
- Link creation form
- Tips for better conversions
- Links list with actions
- Improved empty state

### Login & Signup (/login.html, /signup.html)
- Centered form layout
- Dark card with yellow buttons
- Navigation and footer

### Gate (/gate.html)
- Simplified navbar (logo only)
- Sponsor view interface
- Minimal footer

## Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Hamburger menu for navigation
- Stacked footer columns
- Single column layouts for cards
- Reduced font sizes
- Adjusted padding/spacing

## Accessibility
- High contrast text on dark backgrounds
- Focus visible states with yellow outline
- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support

## Performance
- CSS custom properties for theming
- Minimal external dependencies
- Optimized animations (GPU-accelerated)
- Efficient selectors

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox
- CSS Custom Properties
- CSS Backdrop Filter (with fallbacks)
