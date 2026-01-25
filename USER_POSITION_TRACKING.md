# User Position Tracking Feature

## Overview
The app now tracks and stores user positions in a dedicated `user_positions` table with timestamps. Position updates are sent every 1 minute and stored with full history. The last known position is extracted from this table when displaying offline users.

## Features

### 1. **Dedicated Position History Table**
- New `user_positions` table stores all position updates with timestamps
- Each position record includes:
  - `user_id`: Reference to the user
  - `latitude` and `longitude`: GPS coordinates
  - `accuracy`: Position accuracy in meters
  - `timestamp`: When the position was recorded
- Indexed on `timestamp` and `user_id` for fast queries
- Keeps last 1000 positions per user (older records are automatically deleted)

### 2. **1-Minute Update Interval**
- Position updates are sent to the server every 1 minute
- Real-time position tracking continues in the browser (for smooth map display)
- Server receives periodic updates to build position history

### 3. **Last Known Position Display**
- When a user goes offline, their last position is retrieved from `user_positions` table
- Click on an offline user's icon to see their last known location
- Semi-transparent marker shows where they were last seen
- Marker includes timestamp of last update

### 4. **Visual Indicators**
- **Online users**: Green dot (🟢) - "Sharing Location"
- **Offline users**: Black dot (⚫) - "Offline"
- **Offline users with last position**: Purple text - "📍 Click to see last location"

## Database Schema

### New Table: user_positions
```sql
CREATE TABLE user_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_user_positions_timestamp ON user_positions(timestamp);
CREATE INDEX idx_user_positions_user_id ON user_positions(user_id);
```

### Removed Columns
- Removed `last_latitude` and `last_longitude` from `users` table
- Removed `last_latitude` and `last_longitude` from `session_participants` table

These columns are no longer needed since positions are now queried from the `user_positions` table.

## Migration

To apply the database changes, run:

```bash
python migrate_user_positions.py
```

This script will:
1. Create the `user_positions` table if it doesn't exist
2. Create indexes on `timestamp` and `user_id`
3. Remove `last_latitude` and `last_longitude` columns from `users` table
4. Remove `last_latitude` and `last_longitude` columns from `session_participants` table
5. Display the updated table schemas
6. Confirm successful migration

**Note:** The old migration script `migrate_position_tracking.py` is now obsolete and should not be used.

## API Changes

### Updated Endpoints

#### `/api/update_location` (POST)
**Enhanced behavior:**
- Stores location in the `locations` table (for session tracking)
- **NEW**: Stores position in `user_positions` table (for registered users only)
- Automatically cleans up old records:
  - Keeps last 100 locations per participant in `locations` table
  - Keeps last 1000 positions per user in `user_positions` table

**Request:**
```json
{
  "session_code": "ABC123",
  "latitude": 42.6977,
  "longitude": 23.3219,
  "accuracy": 10.5
}
```

#### `/api/get_participants` (GET)
**Enhanced behavior:**
- For **online users**: Returns current position from `locations` table
- For **offline registered users**: Queries last position from `user_positions` table
- For **offline guest users**: No position data (guests don't have user_id)
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
      "accuracy": 8.2,
      "last_update": "2026-01-25T17:45:00",
      "is_online": false
    }
  ]
}
```

## Frontend Behavior

### Session Page (`session.html`)

1. **Position Update Mechanism**
   - Browser continuously tracks position using `watchPosition` API
   - Position is stored locally in `lastPosition` variable
   - Every 1 minute, the stored position is sent to the server
   - Initial position is sent immediately when sharing starts

2. **Participants List**
   - Shows all active participants
   - Online users have a green indicator
   - Offline users have a black indicator
   - Offline registered users with position history show "📍 Click to see last location"
   - Guest users don't show last location (no user_id to query)

3. **Map Display**
   - **Online users**: Show real-time markers (colorful pins)
   - **Offline users**: No permanent marker on map
   - **Click on offline user**: Shows temporary semi-transparent marker at last known position

4. **Marker Behavior**
   - Online markers update in real-time as position changes
   - Offline markers appear only when clicked
   - Temporary markers auto-remove after 10 seconds

## Use Cases

### 1. **Finding Lost Friends**
If someone's phone dies or they lose signal, you can see where they were last located (up to their last 1-minute update).

### 2. **Position History**
The app maintains a history of up to 1000 position records per user, which could be used for:
- Analyzing movement patterns
- Generating heatmaps
- Creating route visualizations
- Historical playback

### 3. **Meeting Point Reference**
Even after someone leaves the session, you can check where they were last seen.

### 4. **Battery Efficiency**
Sending updates every 1 minute (instead of continuously) reduces:
- Network traffic
- Server load
- Battery consumption on mobile devices

## Privacy Considerations

- Position data is only stored when users actively share their location
- Users can stop sharing at any time
- Last known positions are only visible to participants in the same session
- Guest users (without accounts) don't have position history stored
- Position history is limited to 1000 records per user
- Session creators can remove participants, which clears their active status

## Technical Details

### Position Update Flow

1. User clicks "Share Location"
2. Browser requests geolocation permission
3. `watchPosition` starts tracking position continuously
4. Initial position is sent immediately to server
5. Every 1 minute, the latest position is sent to server
6. Server stores position in:
   - `locations` table (for session tracking)
   - `user_positions` table (for user history, registered users only)
7. Frontend polls `/api/get_participants` every few seconds
8. Backend returns:
   - Current position for online users (from `locations` table)
   - Last known position for offline users (from `user_positions` table)
9. Frontend displays markers accordingly

### Offline Detection

A user is considered offline if:
- No location update in the last 30 seconds (in `locations` table), OR
- User explicitly stopped sharing location

### Data Cleanup

- **Session locations**: Limited to last 100 records per participant
- **User positions**: Limited to last 1000 records per user
- Old records are automatically deleted when new positions are added
- Cleanup happens during the `/api/update_location` call

### Database Indexes

Two indexes are created for optimal query performance:
- `idx_user_positions_timestamp`: For time-based queries
- `idx_user_positions_user_id`: For user-specific queries

This ensures fast retrieval of last known positions even with large datasets.

## Files Modified

1. **[`app.py`](app.py:1)**
   - Added [`UserPosition`](app.py:75) model with timestamp indexing
   - Removed `last_latitude` and `last_longitude` from [`User`](app.py:28) model
   - Removed `last_latitude` and `last_longitude` from [`SessionParticipant`](app.py:55) model
   - Modified [`/api/update_location`](app.py:774) to store positions in `user_positions` table
   - Modified [`/api/get_participants`](app.py:818) to query last positions from `user_positions` table

2. **[`js/session.js`](js/session.js:1)**
   - Added `positionUpdateInterval` variable for 1-minute updates
   - Added `lastPosition` variable to store current position
   - Modified [`startSharing()`](js/session.js:148) to send updates every 1 minute
   - Modified [`stopSharing()`](js/session.js:206) to clear the update interval
   - `watchPosition` now only stores position locally, doesn't send to server

3. **[`migrate_user_positions.py`](migrate_user_positions.py:1)** (NEW)
   - Creates `user_positions` table with indexes
   - Removes old `last_latitude/longitude` columns from `users` and `session_participants`
   - Handles table recreation for SQLite (which doesn't support DROP COLUMN)

## Testing

To test the feature:

1. Run the migration: `python migrate_user_positions.py`
2. Start the app: `python app.py`
3. Create a session and join with multiple registered users
4. Share location from all users
5. Wait 1 minute and verify position update is sent to server
6. Stop sharing from one user
7. Click on the offline user's icon
8. Verify the last known location marker appears on the map with timestamp

## Performance Considerations

### Network Traffic
- **Before**: Continuous updates (could be every few seconds)
- **After**: Updates every 1 minute
- **Reduction**: ~95% less network traffic

### Server Load
- **Before**: Potentially hundreds of updates per minute per user
- **After**: 1 update per minute per user
- **Reduction**: Significant reduction in database writes

### Battery Life
- **Before**: Continuous GPS + network usage
- **After**: Continuous GPS (for map display) + network every 1 minute
- **Improvement**: Reduced network usage improves battery life

### Database Size
- Stores up to 1000 positions per user
- At 1 position/minute, this represents ~16.7 hours of tracking
- Automatic cleanup prevents unlimited growth
- Indexes ensure fast queries even with large datasets

## Future Enhancements

Potential improvements:
- Add API endpoint to retrieve full position history for a user
- Implement position history visualization (route playback)
- Add heatmap generation from position history
- Export position history to GPX/KML format
- Configurable update interval (let users choose 30s, 1min, 5min, etc.)
- Add position accuracy threshold (only save if accuracy is good enough)
- Implement position smoothing/filtering algorithms
- Add geofencing alerts based on position history
