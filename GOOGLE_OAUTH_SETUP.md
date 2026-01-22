# Google OAuth Integration Setup Guide

This guide will help you set up Google OAuth authentication for Hunt-Hunt-Planur.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your application running on HTTPS (required for Google OAuth)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Hunt-Hunt-Planur")
5. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace)
3. Click "Create"
4. Fill in the required information:
   - **App name**: Hunt-Hunt-Planur
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. On the "Scopes" page, click "Add or Remove Scopes"
7. Add these scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
8. Click "Save and Continue"
9. Add test users if needed (for testing phase)
10. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Configure the following:
   - **Name**: Hunt-Hunt-Planur Web Client
   - **Authorized JavaScript origins**: 
     - `https://localhost:5000` (for local development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**: 
     - `https://localhost:5000` (for local development)
     - `https://yourdomain.com` (for production)
5. Click "Create"
6. **IMPORTANT**: Copy your Client ID and Client Secret

## Step 5: Configure Your Application

### Update Environment Variables

Create a `.env` file in your project root (or set environment variables):

```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

### Update config.py

The `config.py` file is already configured to read from environment variables. If you want to set them directly (not recommended for production):

```python
GOOGLE_CLIENT_ID = 'your-client-id-here.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET = 'your-client-secret-here'
```

### Update js/auth.js

Update the `GOOGLE_CLIENT_ID` constant in `js/auth.js`:

```javascript
const GOOGLE_CLIENT_ID = 'your-client-id-here.apps.googleusercontent.com';
```

## Step 6: Install Dependencies

Install the required Python packages:

```bash
pip install -r requirements.txt
```

## Step 7: Update Database Schema

Since we've added new fields to the User model, you need to update your database:

### Option 1: Reset Database (Development Only - Will Delete All Data)

```bash
# Delete the existing database
rm hunt_planur.db

# Run the application to create new database with updated schema
python app.py
```

### Option 2: Manual Migration (Preserve Data)

If you have existing data you want to keep, you'll need to manually update the database:

```python
# Run this in a Python shell
from app import app, db
with app.app_context():
    # Add new columns to users table
    db.engine.execute('ALTER TABLE users ADD COLUMN google_id VARCHAR(255)')
    db.engine.execute('ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500)')
    db.engine.execute('ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT "local"')
    db.engine.execute('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL')
```

## Step 8: Test the Integration

1. Start your Flask application:
   ```bash
   python app.py
   ```

2. Navigate to the login page: `https://localhost:5000/login.html`

3. You should see:
   - Traditional login form
   - "OR" divider
   - Google Sign-In button

4. Click the Google Sign-In button and test the authentication flow

## Troubleshooting

### "redirect_uri_mismatch" Error

- Make sure the redirect URI in Google Cloud Console exactly matches your application URL
- Include the protocol (https://)
- Don't include trailing slashes unless your app uses them

### "Invalid Client ID" Error

- Verify the Client ID in both `config.py` and `js/auth.js` match exactly
- Make sure there are no extra spaces or characters

### Google Sign-In Button Not Appearing

- Check browser console for JavaScript errors
- Ensure the Google Sign-In script is loading (check Network tab)
- Verify the `googleSignInButton` div exists in your HTML

### "Invalid Token" Error

- Make sure your server time is synchronized (Google tokens are time-sensitive)
- Verify the Client ID on the server matches the one used in the frontend

## Security Best Practices

1. **Never commit credentials**: Keep your Client ID and Secret in environment variables
2. **Use HTTPS**: Google OAuth requires HTTPS in production
3. **Validate tokens**: The backend validates all Google tokens before creating sessions
4. **Limit scopes**: Only request the minimum scopes needed (email, profile)
5. **Regular updates**: Keep the Google Auth libraries updated

## Production Deployment

When deploying to production:

1. Update the authorized origins and redirect URIs in Google Cloud Console
2. Set environment variables on your production server
3. Ensure HTTPS is properly configured
4. Consider publishing your OAuth consent screen (remove "Testing" status)

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Websites](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Best Practices](https://tools.ietf.org/html/rfc6749)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the Flask server logs
3. Verify all configuration steps were completed
4. Ensure your database schema is up to date
