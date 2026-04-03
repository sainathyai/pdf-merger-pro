# UI/UX Design Specification
# PDF Merger Pro

**Version:** 1.0  
**Date:** 2026-04-01

---

## 1. Design Philosophy

**Clean. Fast. Trustworthy.**

The design follows three principles:
1. **Minimal friction** — users accomplish tasks in the fewest steps possible
2. **Visual confidence** — users always see what they're working with (previews, thumbnails)
3. **Privacy-first messaging** — subtle but clear indicators that files stay private

---

## 2. Design System

### 2.1 Color Palette

#### Light Mode
| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | Indigo | `#4F46E5` | CTAs, active states, links |
| Primary Hover | Dark Indigo | `#4338CA` | Button hover states |
| Secondary | Slate | `#64748B` | Secondary text, borders |
| Success | Emerald | `#10B981` | Success states, completion |
| Warning | Amber | `#F59E0B` | Warnings, file size alerts |
| Danger | Rose | `#F43F5E` | Delete actions, errors |
| Background | White | `#FFFFFF` | Page background |
| Surface | Gray 50 | `#F8FAFC` | Card backgrounds, upload zones |
| Border | Gray 200 | `#E2E8F0` | Dividers, card borders |
| Text Primary | Gray 900 | `#0F172A` | Headings, body text |
| Text Secondary | Gray 500 | `#64748B` | Captions, helper text |

#### Dark Mode
| Role | Color | Hex |
|------|-------|-----|
| Primary | Indigo 400 | `#818CF8` |
| Background | Gray 950 | `#0B1120` |
| Surface | Gray 900 | `#1E293B` |
| Border | Gray 700 | `#334155` |
| Text Primary | Gray 100 | `#F1F5F9` |
| Text Secondary | Gray 400 | `#94A3B8` |

### 2.2 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 (Page title) | Inter | 32px / 2rem | 700 (Bold) |
| H2 (Section title) | Inter | 24px / 1.5rem | 600 (Semibold) |
| H3 (Card title) | Inter | 18px / 1.125rem | 600 |
| Body | Inter | 16px / 1rem | 400 (Regular) |
| Small / Caption | Inter | 14px / 0.875rem | 400 |
| Button | Inter | 15px / 0.9375rem | 500 (Medium) |
| Monospace (metadata) | JetBrains Mono | 13px | 400 |

**Fallback stack:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### 2.3 Spacing & Layout

- **Base unit:** 4px
- **Common spacings:** 8px, 12px, 16px, 24px, 32px, 48px
- **Max content width:** 1200px (centered)
- **Card padding:** 24px
- **Card border-radius:** 12px
- **Button border-radius:** 8px
- **Grid gap:** 16px (thumbnails), 24px (cards)

### 2.4 Shadows & Elevation

```
Level 0 (flat):     none
Level 1 (card):     0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
Level 2 (dropdown): 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)
Level 3 (modal):    0 10px 25px rgba(0,0,0,0.1), 0 6px 10px rgba(0,0,0,0.06)
Level 4 (toast):    0 20px 40px rgba(0,0,0,0.12)
```

### 2.5 Icons

Using **Lucide Icons** for their clean, consistent look:
- Size: 20px (inline), 24px (buttons), 48px (feature cards)
- Stroke width: 1.5px
- Color: inherits from parent text color

---

## 3. Component Library

### 3.1 Buttons

```
┌─────────────────────────────────────────────────────┐
│  Primary:   [████ Merge PDFs ████]  — filled indigo │
│  Secondary: [──── Split PDF ────]   — outlined      │
│  Ghost:     [     Rotate 90°     ]  — text only     │
│  Danger:    [████  Delete   ████]   — filled rose   │
│  Icon-only: [ ↻ ]                   — circular, 40px│
└─────────────────────────────────────────────────────┘
```

**States:** Default → Hover (darken 8%) → Active (darken 12%) → Disabled (50% opacity)

### 3.2 Upload Zone

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              ┌─────────────────────────┐                    │
│              │                         │                    │
│              │     ☁ (cloud icon)      │                    │
│              │                         │                    │
│              │  Drag & drop PDF files  │                    │
│              │     here, or browse     │                    │
│              │                         │                    │
│              │   Max 100MB per file    │                    │
│              │                         │                    │
│              └─────────────────────────┘                    │
│                                                             │
│  ── dashed border, 2px, rounded 16px ──                     │
│  ── bg: surface color with subtle pulse on drag-over ──     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**States:**
- **Default:** Dashed border (gray-300), surface background
- **Drag Over:** Dashed border (indigo), indigo-50 background, scale(1.01) transform
- **Uploading:** Progress bar overlay at bottom, file name shown
- **Error:** Red border flash, error message below

### 3.3 File Card (in merge list)

```
┌────────────────────────────────────────────────────────┐
│  ⠿  │  📄  document-name.pdf      │  2.4 MB  │  ✕    │
│ grip │  icon  filename              │  size    │ remove │
│      │       12 pages               │          │        │
└────────────────────────────────────────────────────────┘
  ↕ draggable via grip handle
```

- Height: 64px
- Background: white (light) / gray-800 (dark)
- Border: 1px solid border color
- Hover: slight elevation increase (shadow level 1 → 2)
- Dragging: shadow level 3, slight rotation (2deg), opacity 0.9

### 3.4 Page Thumbnail Card

```
┌──────────────────┐
│                   │
│   ┌───────────┐  │
│   │           │  │
│   │  Page     │  │
│   │  Preview  │  │
│   │           │  │
│   └───────────┘  │
│                   │
│    Page 3    ↻ 🗑 │
│   (label) (actions)│
└──────────────────┘
```

- Size: 160px × 210px (portrait ratio)
- Thumbnail: fills card with object-fit: contain
- Selected state: indigo border (2px), checkmark overlay
- Hover: action buttons appear (rotate, delete)
- Grid layout: auto-fill, minmax(160px, 1fr)

### 3.5 Toast Notifications

```
┌──────────────────────────────────────────────────┐
│  ✓  Files merged successfully!          ✕ close  │
└──────────────────────────────────────────────────┘
```

- Position: bottom-right, 24px from edges
- Width: 360px max
- Auto-dismiss: 4 seconds
- Types: success (green), error (red), info (blue), warning (amber)
- Animation: slide in from right, fade out

---

## 4. Page Layouts

### 4.1 Navigation Bar

```
┌──────────────────────────────────────────────────────────────────────┐
│  🔗 PDF Merger Pro        Merge    Split    Reorder    │ ☀/🌙 │    │
│     (logo + name)        (nav links — active underlined) (theme)    │
└──────────────────────────────────────────────────────────────────────┘
```

- Height: 64px
- Background: white/dark with subtle bottom border
- Sticky on scroll
- Mobile: hamburger menu with slide-out drawer
- Active link: indigo text + 2px bottom indicator

### 4.2 Landing Page (Home)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [NAVBAR]                                                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│              PDF Merger Pro                                           │
│              Your private PDF toolkit.                                │
│              Merge, split, and reorder — right in your browser.      │
│                                                                      │
│              🔒 Files never leave your network                       │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│   │   📎 Merge   │  │   ✂ Split    │  │   🔀 Reorder │              │
│   │              │  │              │  │              │              │
│   │  Combine     │  │  Extract     │  │  Drag & drop │              │
│   │  multiple    │  │  specific    │  │  to rearrange│              │
│   │  PDFs into   │  │  pages or    │  │  pages and   │              │
│   │  one file    │  │  ranges      │  │  rotate      │              │
│   │              │  │              │  │              │              │
│   │  [Start →]   │  │  [Start →]   │  │  [Start →]   │              │
│   └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   HOW IT WORKS                                                       │
│                                                                      │
│   ① Upload    →    ② Arrange    →    ③ Download                     │
│   Drop your        Drag to            Get your                       │
│   PDF files        reorder            result                         │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   WHY PDF MERGER PRO?                                                │
│                                                                      │
│   🔒 Private      ⚡ Fast         📱 Mobile        🌙 Dark Mode    │
│   Files stay on   Process in     Works on any     Easy on the      │
│   your network    seconds        device           eyes             │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  Footer: Built with ♥ · Privacy First · No files stored             │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.3 Merge Page

```
┌──────────────────────────────────────────────────────────────────────┐
│  [NAVBAR]                                                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Merge PDFs                                                          │
│  Combine multiple PDF files into a single document.                  │
│                                                                      │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │
│  │                                                               │  │
│  │             ☁  Drag & drop PDF files here                     │  │
│  │                or click to browse                             │  │
│  │                                                               │  │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │
│                                                                      │
│  FILES TO MERGE (3)                          [+ Add More Files]      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  ⠿  │  📄  quarterly-report.pdf     │  2.4 MB  │  ✕          │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │  ⠿  │  📄  appendix-charts.pdf      │  1.1 MB  │  ✕          │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │  ⠿  │  📄  cover-letter.pdf         │  0.3 MB  │  ✕          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ── Options ─────────────────────────────────────────────────────    │
│  Output filename: [merged-document          ] .pdf                   │
│                                                                      │
│                            [████ Merge & Download ████]              │
│                                                                      │
│  ── Progress (shown during merge) ──────────────────────────────     │
│  ████████████░░░░░░░░  60%  Merging page 8 of 14...                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.4 Split Page

```
┌──────────────────────────────────────────────────────────────────────┐
│  [NAVBAR]                                                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Split PDF                                                           │
│  Extract specific pages from your PDF document.                      │
│                                                                      │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ UPLOAD ZONE ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │
│                                                                      │
│  ── After upload ──────────────────────────────────────────────────  │
│                                                                      │
│  📄 annual-report.pdf  •  24 pages  •  8.2 MB       [Change File]   │
│                                                                      │
│  ── Selection Mode ─────────────────────────────────────────────     │
│  (●) Select pages visually    ( ) Enter page range                   │
│                                                                      │
│  ── Page Grid (visual mode) ────────────────────────────────────     │
│                                                                      │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ ████ │  │▐████▐│  │ ████ │  │ ████ │  │▐████▐│  │ ████ │       │
│  │ ████ │  │▐████▐│  │ ████ │  │ ████ │  │▐████▐│  │ ████ │       │
│  │  P1  │  │✓ P2  │  │  P3  │  │  P4  │  │✓ P5  │  │  P6  │       │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘       │
│             selected                       selected                  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ...                       │
│  │ ████ │  │ ████ │  │ ████ │  │ ████ │                             │
│  │  P7  │  │  P8  │  │  P9  │  │ P10  │                             │
│  └──────┘  └──────┘  └──────┘  └──────┘                             │
│                                                                      │
│  ── Page Range (text mode) ─────────────────────────────────────     │
│  Pages: [ 2, 5, 8-12            ]  (e.g., 1-3, 5, 8-12)            │
│                                                                      │
│  Selected: 2 pages                                                   │
│                                                                      │
│  [████ Extract Selected Pages ████]    [Split All (1 PDF per page)] │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.5 Reorder Page

```
┌──────────────────────────────────────────────────────────────────────┐
│  [NAVBAR]                                                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Reorder & Edit Pages                                                │
│  Drag to reorder, rotate, or remove pages from your PDF.            │
│                                                                      │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ UPLOAD ZONE ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │
│                                                                      │
│  ── After upload ──────────────────────────────────────────────────  │
│                                                                      │
│  📄 report.pdf  •  12 pages  •  4.1 MB                              │
│                                                                      │
│  ── Toolbar ────────────────────────────────────────────────────     │
│  [Select All]  [Deselect]  [↻ Rotate Selected]  [🗑 Delete Selected]│
│                                                                      │
│  ── Page Grid (draggable) ──────────────────────────────────────     │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │          │  │          │  │  ·····   │  │          │            │
│  │  Page 1  │  │  Page 2  │  │ dragging │  │  Page 4  │            │
│  │  preview │  │  preview │  │  Page 3  │  │  preview │            │
│  │          │  │          │  │  ·····   │  │          │            │
│  │  P1  ↻ 🗑│  │  P2  ↻ 🗑│  │  P3  ↻ 🗑│  │  P4  ↻ 🗑│            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │          │  │          │  │          │  │          │            │
│  │  Page 5  │  │  Page 6  │  │  Page 7  │  │  Page 8  │            │
│  │          │  │          │  │          │  │          │            │
│  │  P5  ↻ 🗑│  │  P6  ↻ 🗑│  │  P7  ↻ 🗑│  │  P8  ↻ 🗑│            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                      │
│                        [████ Save & Download ████]                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Interaction Design

### 5.1 Drag & Drop Upload

| Trigger | Response |
|---------|----------|
| Files dragged over zone | Border turns indigo, background lightens, zone pulses subtly |
| Files dropped | Upload progress bars appear, thumbnails generate |
| Invalid file type | Red flash, toast: "Only PDF files are supported" |
| File too large | Red flash, toast: "File exceeds 100MB limit" |
| Click on zone | Native file picker opens (accept=".pdf") |

### 5.2 File List Reordering (Merge)

| Trigger | Response |
|---------|----------|
| Grab grip handle | Cursor changes to grab, card lifts (shadow increase) |
| Drag | Card follows cursor, other cards animate apart to show drop position |
| Drop | Card settles into new position with spring animation |
| Remove button (✕) | Card fades out and collapses (300ms), list renumbers |

### 5.3 Page Thumbnail Interactions (Split/Reorder)

| Trigger | Response |
|---------|----------|
| Click thumbnail | Toggle selection (indigo border + checkmark) |
| Hover thumbnail | Subtle scale(1.03), action buttons fade in |
| Click rotate | Page rotates 90° CW with CSS transition |
| Click delete | Confirmation if > 5 pages selected, then fade out |
| Drag thumbnail | Lift with shadow, other thumbnails rearrange fluidly |

### 5.4 Transitions & Animations

- **Duration:** 200ms for micro-interactions, 300ms for layout shifts
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (Material-style ease-in-out)
- **Page transitions:** Fade in (opacity 0→1, translateY 8px→0)
- **Card entrance:** Staggered fade-in (50ms delay between each)
- **Progress bar:** Smooth width transition with indigo gradient
- **Theme toggle:** 200ms color transition on all themed properties

---

## 6. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|-----------|-------|----------------|
| Mobile S | < 375px | Single column, compact spacing |
| Mobile | 375-639px | Single column, full-width cards |
| Tablet | 640-1023px | 2-column thumbnail grid, side margins |
| Desktop | 1024-1279px | 3-4 column grid, comfortable spacing |
| Desktop L | 1280px+ | Max-width container (1200px), centered |

### Mobile Adaptations
- Hamburger nav menu (slide from left)
- Upload zone smaller, "Tap to select files" text
- Thumbnail grid: 2 columns
- File cards: stacked layout (name on top, size below)
- Merge button: full width, sticky bottom bar
- Touch-friendly targets: minimum 44px × 44px

---

## 7. Accessibility

### 7.1 Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between interactive elements |
| Enter/Space | Activate buttons, toggle selection |
| Arrow keys | Navigate thumbnail grid |
| Delete | Remove selected file/page |
| Escape | Close modals, cancel drag |
| Ctrl+A | Select all pages (in split/reorder) |

### 7.2 Screen Reader Support

- All images have descriptive alt text
- Upload zone has `role="button"` and `aria-label`
- File list uses `role="list"` with `aria-label="Files to merge"`
- Drag-and-drop has alternative keyboard reordering (up/down buttons)
- Status updates use `aria-live="polite"` regions
- Progress bar has `role="progressbar"` with `aria-valuenow`

### 7.3 Visual Accessibility

- Color contrast: minimum 4.5:1 for text, 3:1 for UI elements
- Focus rings: 2px solid indigo, 2px offset (visible in both themes)
- No information conveyed by color alone (icons + text accompany status colors)
- Reduced motion: respect `prefers-reduced-motion` — disable animations

---

## 8. Error States

### 8.1 Upload Errors

```
┌─────────────────────────────────────────────────────────┐
│  ⚠  quarterly-report.pdf                                │
│     This file appears to be corrupted or password-       │
│     protected. Please try a different file.              │
│                                                  [Retry] │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Processing Errors

```
┌─────────────────────────────────────────────────────────┐
│  ✕  Merge failed                                         │
│     One or more files could not be processed.            │
│     Try removing files one at a time to find the         │
│     problematic file.                                    │
│                                          [Try Again]     │
└─────────────────────────────────────────────────────────┘
```

### 8.3 Empty States

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│              📄                                          │
│              No files uploaded yet                        │
│              Drop PDF files above to get started          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Loading States

### 9.1 Upload Progress
- Per-file progress bar inside the file card
- Percentage + "Uploading..." text
- Cancel button during upload

### 9.2 Thumbnail Generation
- Skeleton placeholder (pulsing gray rectangle) while generating
- Thumbnails appear one-by-one as they're ready

### 9.3 Processing (Merge/Split/Reorder)
- Full-width progress bar below the action button
- Step indicator: "Merging page 5 of 24..."
- Button changes to disabled state with spinner

---

## 10. Theme Implementation

### Dark/Light Toggle

- Toggle button in navbar (sun/moon icon)
- Preference saved in localStorage
- Respects `prefers-color-scheme` on first visit
- Transition: 200ms on `background-color`, `color`, `border-color`
- Implementation: CSS custom properties toggled via `data-theme` attribute on `<html>`

```css
:root {
  --bg-primary: #FFFFFF;
  --bg-surface: #F8FAFC;
  --text-primary: #0F172A;
  --text-secondary: #64748B;
  --border: #E2E8F0;
  --accent: #4F46E5;
}

[data-theme="dark"] {
  --bg-primary: #0B1120;
  --bg-surface: #1E293B;
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --border: #334155;
  --accent: #818CF8;
}
```
