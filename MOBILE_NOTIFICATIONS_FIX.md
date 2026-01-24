# Mobile Notifications Fix

## Problem
Notifications were not being received on mobile devices when the app was in the background or when the screen was locked. This was because the JavaScript polling mechanism (checking for notifications every 2 seconds) was being paused or throttled by mobile browsers to save battery.

## Solution
Implemented a comprehensive mobile notification system with multiple improvements:

### 1. **Browser Push Notifications**
- Added support for the Web Notifications API
- Notifications now work even when the tab is in the background or screen is locked
- User-friendly permission request banner appears after 3 seconds
- Notifications include:
  - Custom title and message
  - App icon
  - Vibration pattern for mobile devices
  - `requireInteraction: true` to keep notification visible until user interacts

### 2. **Page Visibility API**
- Detects when the page is hidden (background) or visible (foreground)
- Automatically switches to browser notifications when page is hidden
- Tracks missed notifications and shows count when user returns
- Resumes normal in-app notifications when page becomes visible

### 3. **Audio Alerts**
- Added Web Audio API sound alerts
- Plays a beep sound when notification is received
- Works on both desktop and mobile devices

### 4. **Vibration Support**
- Implemented Vibration API for mobile devices
- Custom vibration pattern: [200ms, 100ms, 200ms, 100ms, 200ms]
- Provides haptic feedback when notification arrives

### 5. **User Interface Improvements**
- Added notification permission banner with clear call-to-action
- "Enable Notifications" button for easy permission granting
- "Maybe Later" option to dismiss banner
- Banner auto-shows after 3 seconds if permission not granted
- Responsive design for mobile devices

## Files Modified

### 1. `js/session.js`
- Added `requestNotificationPermission()` function
- Added `showBrowserNotification()` function for push notifications
- Added `playAlertSound()` function for audio alerts
- Added `vibrateDevice()` function for haptic feedback
- Added `showNotificationPermissionBanner()` function
- Implemented Page Visibility API event listener
- Enhanced `checkNotifications()` to use browser notifications when page is hidden
- Added notification permission banner event handlers

### 2. `session.html`
- Added notification permission banner HTML
- Banner includes icon, message, and action buttons

### 3. `css/style.css`
- Added `.notification-permission-banner` styles
- Added gradient background and animation
- Added responsive styles for mobile devices
- Added `slideDown` animation for banner appearance

## How It Works

1. **On Page Load:**
   - After 3 seconds, if notification permission is not granted, a banner appears
   - User can click "Enable Notifications" to grant permission
   - Or click "Maybe Later" to dismiss the banner

2. **When Notification Arrives:**
   - If page is visible: Shows in-app alert panel + sound + vibration
   - If page is hidden: Shows browser notification + sound + vibration
   - Browser notification stays visible until user interacts with it

3. **When User Returns:**
   - If notifications were missed, shows count of missed notifications
   - Automatically checks for new notifications

## Browser Compatibility

- **Browser Notifications:** Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- **Vibration API:** Supported on Android Chrome, Firefox. Not supported on iOS Safari
- **Web Audio API:** Supported in all modern browsers
- **Page Visibility API:** Supported in all modern browsers

## Testing

To test the mobile notifications:

1. Open the session page on your mobile device
2. Grant notification permission when prompted
3. Lock your screen or switch to another app
4. Have another participant send an alert
5. You should receive a browser notification with sound and vibration

## Important Notes

- **HTTPS Required:** Browser notifications only work on HTTPS connections (or localhost)
- **iOS Limitations:** iOS Safari has limited notification support. Consider using PWA for better iOS support
- **Battery Impact:** Minimal battery impact as polling continues at same rate, just uses different notification methods
- **Permission Persistence:** Once granted, notification permission persists across sessions

## Future Enhancements

Consider implementing:
- Service Workers for true background notifications
- Progressive Web App (PWA) for better mobile experience
- Push notification server for real-time delivery without polling
- Notification sound customization
- Do Not Disturb mode
