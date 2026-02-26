# Directive: Implement Alliance Calendar & Timers

## Goal
Replace the basic list view in `src/app/calendar/page.tsx` with a fully functional visual Calendar and Countdown Timer system for Alliance events.
The UI must strictly follow the "WOS Community" standard theme (Dark Blue/Ice/Fire colors).

## Inputs
- **User Session**: To fetch relative events (completed via `/api/user/events`).
- **Theme Tokens**: `wos-bg`, `wos-surface`, `ice-*`, `fire-*`.

## Requirements

### 1. Visual Calendar Component
- **Structure**: a Month view grid (7 columns for days).
- **Navigation**: "Previous Month" and "Next Month" buttons.
- **Indicators**:
    - Days with events should have visual markers (dots or colored bars).
    - Clicking a day should expand/show the list of events for that specific day.
- **Styling**:
    - Background: `wos-bg`.
    - Panels: `wos-surface` with `border-slate-700`.
    - Text: White/Slate-400.
    - Accents: `ice-500` (Sky Blue) for "Today" and selection.

### 2. Next Event Timer (Countdown)
- **Position**: Prominent card (top or side).
- **Function**: Show the *nearest upcoming event* from the user's alliances.
- **Display**: "Event Name starts in: HH:MM:SS".
- **Real-time**: Updates every second.

### 3. Event List (Day View)
- When a day is selected (or by default showing upcoming), list the events card-style.
- Include "Reserve Slot" button for relevant events (bear trap, etc.).

## Execution Plan (Manual - No Script yet)
1.  **Dependencies**: Install `date-fns` for robust date math.
2.  **Component**: Create `src/components/Calendar/CalendarView.tsx`.
3.  **Integration**: Update `src/app/calendar/page.tsx` to use the new component.


### 4. Refined Navigation UI
- Use `lucide-react` for icons (ChevronLeft, ChevronRight).
- Layout: "Month Year" on the left, Navigation controls on the right.
- Style: Transparent/Glassmorphism effect for buttons, clean hover states.
