# Directive: Ministry Reservation System (Refactor)

## Goal
Refactor the "Alliance Reservations" into a "Ministry Days" scheduling system. This allows the ruling alliance (Presidency) to manage and schedule State Minister titles for specific days.
Reference: User provided `wos2517.com/ministry/days` (inferred structure).

## Hypothesized Requirements (To be confirmed by User)
The system should likely allow users to "book" specific Minister titles for specific days to maximize buffs (e.g., Construction speed for construction day).

### 1. Structure
-   **View**: A weekly or monthly grid.
-   **Rows/Columns**:
    -   **Rows**: Dates (Mon, Tue, Wed...).
    -   **Columns**: Minister Titles (Minister of Interior, Supply, Science, Construction, etc.).
-   **Cells**: Show who has reserved that title for that day.

### 2. Minister Titles (Confirmed)
-   **Vice President**: +10% Research, Construction, Training Speed.
-   **Minister of Interior**: +80% Resource Production, Appoint/Remove officials.
-   **Minister of Health**: +100% Healing Speed, +5000 Infirmary Capacity.
-   **Minister of Defense**: +10% Troop's Lethality.
-   **Minister of Strategy**: +5% Troop's Attack, +2500 Deployment Capacity.
-   **Minister of Education**: +50% Training Speed, +200 Training Capacity.

### 3. SvS Preparation Phase Logic
The tool must support a "SvS Mode" that highlights/recommends:
-   **Day 1-3, 5-6**: Recommend **Vice President** (Speedups).
-   **Day 4**: Recommend **Minister of Education** (Training).
-   **Goal**: Help users schedule these specific ministers for maximum points.

### 4. Functionality & Workflow
-   **Reservation Flow**:
    1.  **Select Slot**: User clicks an empty time slot (e.g., 10:00 - 10:30 UTC).
    2.  **Application Form**: User fills in:
        -   **Identity**: ID, Nickname, Alliance (Auto-filled if possible).
        -   **Resource Evidence**:
            -   *Construction/Research*: Fire Crystals, Refined FC, Shards, General Speedups.
            -   *Training*: Training Speedups (Days).
    3.  **Submission**: Request is saved as **PENDING**.
-   **Admin Decision**:
    -   Admins (R5/R4/Ministers) view a "Queue" of requests.
    -   They compare "Resources Input" to decide the most efficient use of the buff.
    -   **Action**: Approve (assigns slot) or Reject.

### 5. Data Model
-   **MinistryReservation**:
    -   `status`: PENDING | APPROVED | REJECTED
    -   `data`: JSON field to store the variable resource inputs (FC count, etc).
    -   `timeSlot`: Start/End DateTimes.

## Execution Steps
1.  **Database**: Create `MinistryReservation` model.
    -   `date`: DateTime
    -   `position`: Enum/String
    -   `userId`: Relation to User
    -   `status`: PENDING / APPROVED
2.  **UI Component**: `Ministryscheduler`.
3.  **Page**: `/ministry/days` (or replace current reservation page).

## Questions for User
-   Is this the correct structure (Day x Title)?
-   Should this be strictly for the *Ruling Alliance* or can anyone request?
