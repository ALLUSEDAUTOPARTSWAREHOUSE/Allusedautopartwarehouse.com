## RESPONSIVE DESIGN PREVIEW GUIDE

### How to View Responsive Mockups in v0

Your website is fully responsive. To see how it appears on desktop, tablet, and mobile screens:

**In the v0 Preview:**
1. Click the **Preview** button (browser icon) in the top right
2. Use your browser's **Inspect/DevTools** (F12 or Cmd+Option+I)
3. Click the **Device Toggle** icon (phone/tablet icon in DevTools)
4. Select different device sizes:
   - **Desktop**: 1280px+ (full layout)
   - **Tablet**: 768px-1024px (iPad size)
   - **Mobile**: 375px-480px (iPhone size)

---

### Responsive Breakpoints & Features

#### **DESKTOP (1280px+)**
- Full-width header with all navigation visible
- Logo: 56px with embossed text visible
- Nav items: embossed typography pills centered
- Phone display: visible inline with "1-888-887-4199"
- Process section: 4-column grid layout
- Hero section: 2-column layout (content + form side-by-side)
- All premium effects: shadows, glows, embossing fully visible

#### **TABLET (768px - 1024px)**
- Header adapts to smaller viewport
- Logo: 48px
- Navigation: simplified, menu button appears at lg breakpoint
- Phone display: hidden (uses mobile menu)
- Process section: 2-column grid layout (2x2 cards)
- Hero section: stacked layout (content on top, form below)
- Padding/margins: reduced for narrower screens
- Font sizes: clamp() functions scale smoothly

#### **MOBILE (375px - 480px)**
- Header: compact, mobile-optimized
- Logo: 44px, tightly spaced
- Navigation: hamburger menu toggles drawer
- Phone display: hidden, shown in mobile menu
- Process section: 1-column stack (all cards single column)
- Hero section: full-width single column
- Touch-friendly: buttons and links 44px+ minimum
- Typography: scaled down with clamp() functions
- Padding: reduced to 16px horizontal
- All glass effects maintained for visual consistency

---

### Key Responsive Utilities Used

**Tailwind Responsive Classes:**
- `sm:` (640px) - Small screens
- `md:` (768px) - Medium/Tablets
- `lg:` (1024px) - Large desktop
- `xl:` (1280px) - Extra large desktop

**Scaling Functions:**
- `clamp(min, preferred, max)` - Fluid typography
  - Hero heading: `clamp(1.75rem, 4vw, 3rem)`
  - Process heading: `clamp(1.6rem, 4vw, 2.8rem)`

**Display Control:**
- `hidden lg:flex` - Hidden mobile, visible desktop
- `hidden xl:flex` - Phone display only on xl+
- `flex lg:hidden` - Menu button only on mobile/tablet

---

### Component Responsive Patterns

**Navbar:**
- Scrolling banner: always visible (32px height)
- Logo + wordmark: scales from 44px (mobile) to 56px (desktop)
- Nav links: `hidden lg:flex` - appears only on desktop
- Menu button: `lg:hidden` - hamburger on mobile/tablet
- Mobile drawer: opens/closes with animation
- Phone display: `hidden xl:flex` - only on xl screens

**Hero Section:**
- Grid: `grid-cols-1 lg:grid-cols-2` - stacked on mobile, side-by-side on desktop
- Logo badge: scales `sm:w-[72px]` → `lg:w-[80px]`
- Heading: `text-[clamp(1.75rem,4vw,3rem)]` - responsive scaling
- Buttons: stack vertically `flex-col sm:flex-row` on mobile

**Process Section:**
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
  - Mobile: 1 column (vertical stack)
  - Tablet: 2 columns (2x2 layout)
  - Desktop: 4 columns (horizontal row)
- Card padding: 28px (scales with rem units)
- Font sizes: use clamp() for smooth scaling

---

### Testing Checklist

✅ **Desktop (1280px+):**
- All nav items visible as embossed text
- Phone number inline on right
- 4-column process grid
- Hero content and form side-by-side
- All animations and effects running
- Max-width container centered

✅ **Tablet (768px - 1024px):**
- Hamburger menu appears
- Navigation hidden, menu toggles drawer
- Process: 2x2 grid
- Hero: stacked layout
- Touch targets 44px+
- Readable font sizes

✅ **Mobile (375px):**
- Single-column layout throughout
- Hamburger menu default state
- Process: 1 column vertical stack
- Hero: content stacked, form below
- Padding: 16px sides
- All text readable without zoom
- Buttons/links touch-friendly

---

### Visual Elements Maintained Across All Sizes

- **Glassmorphism effects**: blur(24px) backdrop filter on all screens
- **Embossed typography**: maintained with text-shadow on mobile (scaled down)
- **LED animations**: process-led-num, nav-underline-led, cta-premium-pulse run on all devices
- **Metal-line dividers**: visible on desktop and mobile
- **Mercury chrome gradients**: preserved at all breakpoints
- **Scrolling banner**: continuous animation on all screens

---

### Recommended Viewing Order

1. Open Preview in v0
2. Start at **Desktop (1280px)** - see full-featured layout
3. Resize to **Tablet (768px)** - watch grid change from 4 to 2 columns
4. Resize to **Mobile (375px)** - see single-column, hamburger menu
5. Use DevTools to test intermediate sizes (800px, 600px, etc.)

All responsive breakpoints are defined in `app/globals.css` and component files using Tailwind's responsive prefixes.
