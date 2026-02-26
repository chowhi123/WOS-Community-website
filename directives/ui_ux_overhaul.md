# WOS UI/UX Overhaul Directive

## Goal
Transform the community website to reflect the "White Out Survival" aesthetic, ensuring a premium, immersive experience.

## Design Rules

### 1. Color Palette
- **Backgrounds**: NEVER use `bg-slate-900` or `bg-slate-800` for main backgrounds.
  - Page Background: `bg-wos-bg` (#0B101B)
  - Card/Panel Background: `bg-wos-surface` (#151E2F)
- **Accents**:
  - Primary (Ice): `text-ice-400`, `bg-ice-600`
  - Secondary (Fire): `text-fire-400`, `bg-fire-500` (for urgency/hot items)
- **Text**:
  - Headings: `text-white`
  - Body: `text-slate-300` (acceptable for readability)
  - Muted: `text-slate-500`

### 2. Typography
- Use `font-heading` (Outfit) for all H1, H2, H3, and major UI headers.
- Use `font-sans` (Inter) for body text.

### 3. Components
- **Buttons**: Use gradients (e.g., `bg-gradient-to-r from-ice-500 to-ice-600`) for primary actions.
- **Cards**: Use `bg-wos-surface`, `border-white/10` (glass effect hint), `shadow-lg`.
- **Interactions**: Add `hover:scale-105`, `active:scale-95` transformations for interactive elements.

### 4. Layout
- Maintain the 3-column layout but ensure the "Left" and "Right" sidebars are visually distinct from the main feed.
- Sticky Navbar must be `backdrop-blur-md bg-wos-bg/80`.
