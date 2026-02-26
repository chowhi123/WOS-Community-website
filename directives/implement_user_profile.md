# Directive: Implement User Profile

## Goal
Implement a functional User Profile page accessible at `/auth/profile` (as currently linked in the Navbar) OR refactor to `/profile` if preferred. Given the user's report (404 at `/auth/profile`), we should implement the page there or redirect.
*Decision*: Let's implement at `/profile` and update Navbar to point there, as `/auth/` is typically for auth flows (signin/up).
Actually, to fix the 404 immediately without confusing the user who might have bookmarked it, I can create `/app/auth/profile/page.tsx`, but `/profile` is cleaner.
**Final Decision**: Create `/app/profile/page.tsx` and **update Navbar** to link to `/profile`.

## Status: ✅ Completed
- **Page**: Implemented at `src/app/profile/page.tsx`.
- **API**: Implemented at `src/app/api/user/profile/route.ts`.
- **Security**: Protected by `src/middleware.ts` (redirects unauthenticated users).
- **Navbar**: Avatar links to `/profile`.

## Inputs
- **User Session**: To fetch current user data.
- **DB Schema**: `User` model (serverCode, displayName, image, memberships).

## Requirements

### 1. Functionality
- **Display**: User's Avatar (Google Image or Default Initials), Name, Email (masked/read-only), `DisplayName`, `ServerCode`.
- **Edit**: Allow updating `DisplayName` and `ServerCode`.
- **My Alliances**: List alliances the user is a member of.
- **Logout**: Button to sign out.

### 2. UI/UX
- **Theme**: WOS Standard (Dark Blue/Ice/Fire).
- **Layout**:
    - Header: Profile Card with Avatar and Basic Info.
    - Body:
        - "Identity" Section: Form to edit Name/Server.
        - "My Alliances" Section: Cards for joined alliances.
- **Glassmorphism**: Use `bg-wos-surface` and borders.

## Execution Steps
1.  **API**: Create `/api/user/profile` (GET/PUT) to handle fetching full data and updating fields.
2.  **Page**: Create `/app/profile/page.tsx`.
3.  **Navbar**: Update `src/components/Navbar.tsx` to points to `/profile`.

## Edge Cases
- **Not Logged In**: Redirect to `/auth/signin`.
- **Validation**: `serverCode` should start with `#`.
