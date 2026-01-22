# Location Sharing Guide

## How Location Sharing Works

The Hunt-Hunt-Planur application allows real-time location sharing between participants in a session. Here's how it works:

### Understanding the Map Pins

**Important:** Map pins (markers) only appear when participants actively share their location.

#### Why Don't I See Pins?

Pins will NOT appear if:
1. ❌ Participants haven't clicked the "Share Location" button
2. ❌ Participants denied location permission in their browser
3. ❌ Participants are not using HTTPS (required for geolocation)
4. ❌ Location services are disabled on the device

Pins WILL appear when:
1. ✅ A participant clicks "Share Location"
2. ✅ They grant location permission to the browser
3. ✅ They're accessing via HTTPS
4. ✅ Their device has location services enabled

### Step-by-Step: How to Share Your Location

#### 1. Join or Create a Session
- Create a new session from the dashboard, OR
- Join an existing session with a session code

#### 2. Click "Share Location" Button
- Look for the blue "Share Location" button on the map
- Click it to start sharing

#### 3. Grant Permission
- Your browser will ask for location permission
- Click "Allow" or "Accept"

#### 4. Your Pin Appears
- Once permission is granted, your pin will appear on the map
- Your name will be displayed on the pin
- Other participants can see your location in real-time

### Viewing Other Participants

#### Participants List (Right Sidebar)
Shows all participants in the session:
- **🟢 Online** - Currently sharing location
- **⚫ Offline** - Not sharing location or haven't shared yet
- **Last update** - When their location was last updated

#### Map Markers
- Each participant gets a unique colored pin
- Pins show the participant's name
- Click a pin to see more details
- Pins update automatically every 3 seconds

### Troubleshooting: Pins Not Appearing

#### Check 1: Is Location Sharing Active?
- Look at the button - it should say "Stop Sharing" (red) when active
- If it says "Share Location" (blue), click it to start sharing

#### Check 2: Browser Permission
- Check if you granted location permission
- Look for a location icon in your browser's address bar
- Click it to manage permissions

#### Check 3: HTTPS Connection
- Verify the URL starts with `https://` (not `http://`)
- If using HTTP, geolocation won't work
- See [GEOLOCATION_FIX.md](GEOLOCATION_FIX.md) for HTTPS setup

#### Check 4: Device Location Services
**On Mobile:**
- iOS: Settings > Privacy > Location Services (must be ON)
- Android: Settings > Location (must be ON)

**On Desktop:**
- Windows: Settings > Privacy > Location (must be ON)
- Mac: System Preferences > Security & Privacy > Privacy > Location Services

#### Check 5: Browser Console
Open browser developer tools (F12) and check the Console tab for errors:
- `Failed to get location` - Permission denied or HTTPS issue
- `Map not initialized` - Page loading issue, try refreshing
- Network errors - Check internet connection

### Common Scenarios

#### Scenario 1: I Created a Session
1. You're automatically added as a participant
2. Your name appears in the header
3. Click "Share Location" to show your pin
4. Share the session code with others

#### Scenario 2: I Joined as Guest
1. Enter your name and session code
2. You're added to the participants list
3. Click "Share Location" to show your pin
4. You'll see other participants who are sharing

#### Scenario 3: Multiple Participants
1. Each participant must click "Share Location" individually
2. Pins appear as each person starts sharing
3. Different colored pins for each participant
4. Real-time updates every 3 seconds

### Features

#### Center on Me Button
- Click "📍 Center on Me" to center the map on your location
- Useful if you've zoomed/panned away from your position

#### Copy Session Code
- Click "Copy" next to the session code
- Share it with others to invite them

#### Leave Session
- Click "Leave Session" to exit
- Your pin will disappear from the map
- You can rejoin later with the same code

### Privacy & Security

#### What's Shared
- ✅ Your current latitude and longitude
- ✅ Location accuracy (in meters)
- ✅ Timestamp of last update

#### What's NOT Shared
- ❌ Location history (only current location)
- ❌ Personal information beyond your name
- ❌ Device information

#### Control Your Privacy
- You can stop sharing at any time
- Leave the session to remove your location
- Close the browser tab to stop sharing
- Location is only shared while the page is open

### Technical Details

#### Update Frequency
- Location updates every time your device reports a change
- Map refreshes every 3 seconds
- Old locations are cleaned up (keeps last 100 per participant)

#### Accuracy
- Depends on your device and environment
- GPS: 5-10 meters (outdoor)
- WiFi: 20-50 meters (indoor)
- Cell tower: 100-1000 meters (poor signal)

#### Browser Support
- Chrome 50+
- Firefox 45+
- Safari 10+
- Edge 14+
- Opera 37+

All browsers require HTTPS for geolocation on non-localhost connections.

### Tips for Best Results

1. **Use HTTPS** - Required for remote access
2. **Enable GPS** - Better accuracy than WiFi/cell
3. **Go Outdoors** - GPS works best with clear sky view
4. **Grant Permissions** - Allow location access when prompted
5. **Keep Page Open** - Location sharing stops when you close the tab
6. **Check Connection** - Ensure stable internet connection
7. **Use Modern Browser** - Latest versions work best

### Debugging Checklist

If pins aren't appearing, check:
- [ ] HTTPS is being used (URL starts with https://)
- [ ] "Share Location" button was clicked
- [ ] Browser permission was granted
- [ ] Device location services are enabled
- [ ] Internet connection is stable
- [ ] Browser console shows no errors (F12)
- [ ] Other participants have also clicked "Share Location"

### Need Help?

1. Check browser console for error messages (F12)
2. Verify HTTPS setup: [GEOLOCATION_FIX.md](GEOLOCATION_FIX.md)
3. Review HTTPS configuration: [HTTPS_SETUP.md](HTTPS_SETUP.md)
4. Check Flask server logs for backend errors

---

**Remember:** Everyone must click "Share Location" individually for their pin to appear on the map!
