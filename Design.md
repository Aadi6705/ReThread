# ReThread — Design System & Visual Specification

This document provides the canonical design tokens, typography rules, color specifications, and UI component standards extracted directly from the Figma UI designs (`s1` through `s21`).

---

## 1. Brand Concept & Aesthetic Vision

ReThread embodies a **curated, collegiate, sustainable thrift aesthetic**. It combines:
- **Warm linen/editorial backgrounds** that evoke campus circularity and mindful consumption.
- **Deep forest green accents** conveying trust, quality, and environmental consciousness.
- **Editorial serif headings** paired with **utilitarian sans-serif UI typography**.
- **Soft card architecture** with rounded corners, subtle hairline borders, and tactile shadows.

---

## 2. Color Palette & Tokens

### Primary & Brand Colors
| Token Name | Hex Code | HSL / CSS Var | Usage |
|---|---|---|---|
| `--color-brand-primary` | `#1a3a2a` | `hsl(150, 38%, 16%)` | Primary buttons, active nav indicators, hero titles |
| `--color-brand-primary-hover` | `#132c1f` | `hsl(150, 38%, 12%)` | Primary button hover and pressed states |
| `--color-brand-sage` | `#e8f0eb` | `hsl(140, 20%, 93%)` | Accent containers, selected category chips, active tab pills |
| `--color-brand-sage-light` | `#f1f6f3` | `hsl(140, 25%, 96%)` | Hover states for subtle interactive elements |

### Neutral & Surface Colors
| Token Name | Hex Code | Usage |
|---|---|---|
| `--color-bg-canvas` | `#f5f3ee` | Default page background (warm linen/off-white) |
| `--color-bg-surface` | `#ffffff` | Content cards, modal sheets, floating panels, form inputs |
| `--color-bg-subtle` | `#edeae2` | Secondary backgrounds, dividers, active filter chips |
| `--color-border-subtle` | `#e2ded6` | Card borders, table dividers, input default borders |
| `--color-border-focus` | `#1a3a2a` | Form input focus ring / border |

### Text & Content Colors
| Token Name | Hex Code | Usage |
|---|---|---|
| `--color-text-primary` | `#191c1a` | Headings, titles, price values, active labels |
| `--color-text-secondary` | `#5c645d` | Subheadings, metadata, descriptions, category text |
| `--color-text-muted` | `#8a938c` | Placeholders, timestamps, breadcrumbs |
| `--color-text-inverse` | `#ffffff` | Text on brand primary buttons and dark badges |

### Status & Badge Palette
| Status | Background | Text Color | Usage |
|---|---|---|---|
| **Active / Available** | `#eaf7ed` | `#1e6b36` | Active listings, open purchase requests |
| **Reserved** | `#fff8e6` | `#9c6500` | Listings with accepted request, pending meetup |
| **Sold** | `#f3f4f6` | `#4b5563` | Completed transactions, archived listings |
| **Rejected / Cancelled** | `#fef2f2` | `#b91c1c` | Cancelled requests, disputed state |
| **Verified Student** | `#e8f0eb` | `#1a3a2a` | Student verification pill with checkmark icon |

---

## 3. Typography Hierarchy

### Font Families
- **Display / Headings (Serif)**: `Playfair Display`, serif (or `Cinzel` / `Cormorant Garamond` fallback)
- **UI & Body (Sans-serif)**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`

### Type Scale
| Role | Font Family | Size | Weight | Line Height | Tracking |
|---|---|---|---|---|---|
| **Display H1** | Serif | `36px` / `2.25rem` | 600 (Semi-bold) | `1.2` | `-0.02em` |
| **Page Title H2** | Serif | `28px` / `1.75rem` | 600 (Semi-bold) | `1.25` | `-0.01em` |
| **Section Header H3** | Sans-serif | `20px` / `1.25rem` | 600 (Semi-bold) | `1.3` | `0` |
| **Item Title / Card H4**| Sans-serif | `16px` / `1.0rem` | 600 (Semi-bold) | `1.4` | `0` |
| **Body Standard** | Sans-serif | `14px` / `0.875rem` | 400 (Regular) | `1.5` | `0` |
| **Body Medium** | Sans-serif | `14px` / `0.875rem` | 500 (Medium) | `1.5` | `0` |
| **Caption / Small** | Sans-serif | `12px` / `0.75rem` | 400 (Regular) | `1.4` | `0.01em` |
| **Price Hero** | Sans-serif | `22px` / `1.375rem` | 700 (Bold) | `1.2` | `-0.01em` |

---

## 4. Layout, Grid & Breakpoints

- **Max Content Width**: `1312px` (centered with auto horizontal margins)
- **Container Padding**:
  - Desktop: `32px` (`px-8`)
  - Tablet: `24px` (`px-6`)
  - Mobile: `16px` (`px-4`)

### Responsive Breakpoint Rules:
1. **Desktop Wide (`>= 1280px`)**:
   - 4-column product grid (`grid-cols-4`, gap `24px`)
   - Persistent top navigation with Buy/Sell toggle and profile pill
2. **Desktop Standard (`1024px - 1279px`)**:
   - 3-column product grid (`grid-cols-3`, gap `20px`)
3. **Tablet (`768px - 1023px`)**:
   - 2-column product grid (`grid-cols-2`, gap `16px`)
   - Collapsible filter drawer
4. **Mobile (`< 768px`)**:
   - 2-column compact grid (`grid-cols-2`, gap `12px`)
   - Bottom floating navigation bar or simplified drawer
   - Full-width modal sheets for action workflows

---

## 5. Component Specifications

### 5.1 Mode Switcher (Buy / Sell)
- Located prominently in the top header.
- Pill container with background `#edeae2` and subtle inner padding (`4px`).
- Active state pill has white surface background, `#1a3a2a` text, and subtle elevation shadow (`shadow-sm`).
- Inactive state has muted text `#5c645d` with smooth 200ms ease transition.

### 5.2 Product Card
- **Border radius**: `12px` (`rounded-xl`).
- **Surface**: Pure white (`#ffffff`) with `1px solid #e2ded6`.
- **Image container**: Aspect ratio `4:3` or `1:1`, object-fit cover, subtle hover zoom (`scale-105` duration 300ms).
- **Floating Wishlist Button**: Top-right corner of image, circular (`w-8 h-8`), white blur background with heart icon.
- **Badge**: Bottom-left corner of image for status (e.g. `Reserved`) or condition (e.g. `Like New`).
- **Footer**: Bold price in INR (`₹ 1,200`), original crossed-out price if discounted, seller campus name.

### 5.3 Buttons
- **Primary Button**: Background `#1a3a2a`, text `#ffffff`, height `44px` (`h-11`), padding `px-6`, rounded `8px` (`rounded-lg`), font-weight `500`.
- **Secondary Button**: Border `1.5px solid #1a3a2a`, text `#1a3a2a`, background `transparent`, hover background `#e8f0eb`.
- **Ghost / Tertiary**: Transparent background, text `#5c645d`, hover text `#1a3a2a`, hover background `#f1f6f3`.

### 5.4 Form Fields & Inputs
- Height `44px`, background `#ffffff`, border `1px solid #e2ded6`, border-radius `8px`.
- Focus state: border-color `#1a3a2a`, box-shadow `0 0 0 2px rgba(26, 58, 42, 0.15)`.
- Clear inline error messages in `#b91c1c` with warning icon.
