# Position Tracking Feature

## Overview
The app now tracks and stores everyone's last known position in both the user profile and session participant records. This allows you to see a user's last known location even when they are offline.

## Features

### 1. **Persistent Position Storage**
- Every time a user shares their location, it's stored in two places:
  - **User Profile**: `last_latitude` and `last_longitude` in the `users` table
  - **Session Participant**: `last_latitude` and `last_longitude` in the `session_participants` table

### 2. **Offline User Location Display**
- When a user goes offline (stops sharing location), their last known position is preserved
- Click on an offline user's icon in the participants list to see their last known location
- A semi-transparent marker appears on the map showing where they were last seen
- The marker automatically disappears after 10 seconds

### 3. **Visual Indicators**
- **Online users**: Green dot (🟢) - "Sharing Location"
- **Offline users**: Black dot (⚫) - "Offline"
- **Offline users with last location**: Purple text - "📍 Click to see last location"

## Database Schema Changes

### Users Table
```sql
ALTER TABLE users ADD COLUMN last_latitude REAL;
ALTER TABLE users ADD COLUMN last_longitude REAL;
```

### Session Participants Table
```sql
ALTER TABLE session_participants ADD COLUMN last_latitude REAL;
ALTER TABLE session_participants ADD COLUMN last_longitude REAL;
```

## Migration

To apply the database changes, run:

```bash
python migrate_position_tracking.py
```

This script will:
1. Check if the columns already exist
2. Add the new columns if needed
3. Display the updated table schemas
4. Confirm successful migration

## API Changes

### Updated Endpoints

#### `/api/update_location` (POST)
**Enhanced behavior:**
- Stores location in the `locations` table (as before)
- **NEW**: Updates `last_latitude` and `last_longitude` in `session_participants` table
- **NEW**: Updates `last_latitude` and `last_longitude` in `users` table (for registered users)

#### `/api/get_participants` (GET)
**Enhanced behavior:**
- For **online users**: Returns current position from latest location record
- For **offline users**: Returns last known position from `session_participants` record
- Always includes `is_online` flag to distinguish between current and last known positions

**Response format:**
```json
{
  "success": true,
  "participants": [
    {
      "id": 1,
      "user_id": 5,
      "name": "John Doe",
      "is_guest": false,
      "profile_picture": "https://...",
      "latitude": 42.6977,
      "longitude": 23.3219,
      "accuracy": 10.5,
      "last_update": "2026-01-25T18:00:00",
      "is_online": true
    },
    {
      "id": 2,
      "user_id": 6,
      "name": "Jane Smith",
      "is_guest": false,
      "profile_picture": "https://...",
      "latitude": 42.6980,
      "longitude": 23.3225,
      "accuracy": null,
      "last_update": "2026-01-25T17:45:00",
      "is_online": false
    }
  ]
}
```

## Frontend Behavior

### Session Page (`session.html`)

1. **Participants List**
   - Shows all active participants
   - Online users have a green indicator
   - Offline users have a black indicator
   - Offline users with last known positions show "📍 Click to see last location"

2. **Map Display**
   - **Online users**: Show real-time markers (colorful pins)
   - **Offline users**: No permanent marker on map
   - **Click on offline user**: Shows temporary semi-transparent marker at last known position

3. **Marker Behavior**
   - Online markers update in real-time
   - Offline markers appear only when clicked
   - Temporary markers auto-remove after 10 seconds

## Use Cases

### 1. **Finding Lost Friends**
If someone's phone dies or they lose signal, you can still see where they were last located.

### 2. **Meeting Point Reference**
Even after someone leaves the session, you can check where they were last seen.

### 3. **Session History**
The last known position is preserved in the session participant record for historical reference.

### 4. **User Profile**
Each user's profile maintains their last known position across all sessions.

## Privacy Considerations

- Position data is only stored when users actively share their location
- Users can stop sharing at any time
- Last known positions are only visible to participants in the same session
- Session creators can remove participants, which clears their active status

## Technical Details

### Position Update Flow

1. User shares location via browser geolocation API
2. Frontend sends position to `/api/update_location`
3. Backend stores position in three places:
   - `locations` table (for history/tracking)
   - `session_participants.last_latitude/longitude` (for session-specific last position)
   - `users.last_latitude/longitude` (for user's global last position)
4. Frontend polls `/api/get_participants` every few seconds
5. Backend returns:
   - Current position for online users (from recent `locations` record)
   - Last known position for offline users (from `session_participants` record)
6. Frontend displays markers accordingly

### Offline Detection

A user is considered offline if:
- No location update in the last 30 seconds, OR
- User explicitly stopped sharing location

### Data Cleanup

- Location history is limited to last 100 records per participant
- Old location records are automatically deleted
- Last known positions persist until overwritten by new location updates

## Files Modified

1. **`app.py`**
   - Updated `User` model with `last_latitude` and `last_longitude`
   - Updated `SessionParticipant` model with `last_latitude` and `last_longitude`
   - Modified `/api/update_location` to store last positions
   - Modified `/api/get_participants` to return last positions for offline users

2. **`js/session.js`**
   - Already had support for displaying offline user positions
   - No changes needed (feature-ready)

3. **`migrate_position_tracking.py`** (NEW)
   - Database migration script to add new columns

## Testing

To test the feature:

1. Run the migration: `python migrate_position_tracking.py`
2. Start the app: `python app.py`
3. Create a session and join with multiple users
4. Share location from all users
5. Stop sharing from one user
6. Click on the offline user's icon
7. Verify the last known location marker appears on the map

## Future Enhancements

Potential improvements:
- Add timestamp to last known position display
- Show accuracy radius for last known positions
- Add option to clear last known position
- Export last known positions for all participants
- Show position history trail on map
