# Directive: Implement Admin User Management

## Goal
Create a management interface for the Site Manager (Admin) to view, control, and delete users.

## Inputs
- **User Session**: Must be `globalRole = ADMIN`.
- **User Data**: `User` model extended with `isActive`.

## Requirements

### 1. Admin Users Page (`/admin/users`)
- **Access Control**: Only accessible by users with `GlobalRole.ADMIN`.
- **Display**: Table of all users.
    - **Columns**:
        - User Info (Avatar, DisplayName, ServerCode, Email).
        - Status (Active/Inactive).
        - Last Login (`lastActiveAt`).
        - Last Post (Title + Date).
        - Last Comment (Snippet + Date).
- **Features**:
    - **Search**: By name or email.
    - **Status Toggle**: Button to Deactivate/Activate user.
    - **Delete**: Button to permanently delete user (with confirmation).

### 2. API (`/api/admin/users`)
- **GET**: List users with sorting and including last post/comment relations.
- **PATCH**: Update `isActive` status.
- **DELETE**: Remove user from DB.

## Execution Steps
1.  **Schema**: Added `isActive` (Done).
2.  **API**: Implement `/api/admin/users/route.ts` (GET) and `/api/admin/users/[id]/route.ts` (PATCH, DELETE).
3.  **UI**: Create `/app/admin/users/page.tsx` using a Reusable Table component or inline table.
4.  **Integration**: Add link to `/admin/users` in the Admin Dashboard or Header.

## Edge Cases
- **Self-Deletion**: Admin cannot delete themselves.
- **Data Integrity**: Deleting a user should cascade delete their posts/comments (Prisma handles this via relations, usually).
