# Google OAuth Quick Start - Fix "OAuth client was not found" Error

## The Error You're Seeing

```
Access blocked: Authorization Error
The OAuth client was not found.
Error 401: invalid_client
```

This error means the Google Client ID in your code doesn't match a real OAuth client in Google Cloud Console. You need to create one first.

## ⚠️ Important: You Need ngrok

Google OAuth requires a public HTTPS URL. Since `localhost` and local IP addresses won't work, you need to use **ngrok** to create a secure tunnel.

**👉 Follow the [ngrok Setup Guide](NGROK_SETUP.md) first, then come back here.**

## Quick Fix (10 Minutes)

### Step 1: Create Google Cloud Project & OAuth Client

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Create a new project**:
   - Click the project dropdown at the top
   - Click "NEW PROJECT"
   - Name it "Hunt-Hunt-Planur"
   - Click "CREATE"

3. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "External" user type
   - Click "CREATE"
   - Fill in:
     - App name: `Hunt-Hunt-Planur`
     - User support email: `your-email@gmail.com`
     - Developer contact: `your-email@gmail.com`
   - Click "SAVE AND CONTINUE"
   - Click "SAVE AND CONTINUE" on Scopes page (default scopes are fine)
   - Click "SAVE AND CONTINUE" on Test users page
   - Click "BACK TO DASHBOARD"

4. **Create OAuth Client ID**:
   - Go to "APIs & Services" > "Credentials"
   - Click "CREATE CREDENTIALS" > "OAuth client ID"
   - Application type: "Web application"
   - Name: `Hunt-Hunt-Planur Web Client`
   - Authorized JavaScript origins:
     - Click "ADD URI"
     - Enter your ngrok URL: `https://YOUR-NGROK-URL.ngrok-free.app`
   - Authorized redirect URIs:
     - Click "ADD URI"
     - Enter your ngrok URL: `https://YOUR-NGROK-URL.ngrok-free.app`
   
   **Note**: Get your ngrok URL by following the [ngrok Setup Guide](NGROK_SETUP.md)
   - Click "CREATE"
   - **COPY YOUR CLIENT ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)
   - **COPY YOUR CLIENT SECRET**

### Step 2: Update Your Code

1. **Update `js/auth.js`** (line 4):
   ```javascript
   const GOOGLE_CLIENT_ID = 'YOUR-CLIENT-ID-HERE.apps.googleusercontent.com';
   ```
   Replace `YOUR-CLIENT-ID-HERE` with the Client ID you just copied.

2. **Update `config.py`** (line 20):
   ```python
   GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID') or 'YOUR-CLIENT-ID-HERE.apps.googleusercontent.com'
   GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET') or 'YOUR-CLIENT-SECRET-HERE'
   ```
   Replace the placeholder values with your actual credentials.

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Update Database

**Option A - Fresh Start (Recommended for Development)**:
```bash
# Delete old database
rm hunt_planur.db

# Restart your app - it will create a new database with the updated schema
python app.py
```

**Option B - Keep Existing Data**:
```python
# Run this in Python shell
from app import app, db
with app.app_context():
    with db.engine.connect() as conn:
        conn.execute(db.text('ALTER TABLE users ADD COLUMN google_id VARCHAR(255)'))
        conn.execute(db.text('ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500)'))
        conn.execute(db.text('ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT "local"'))
        conn.commit()
```

### Step 5: Test

1. Restart your Flask app
2. Go to `https://localhost:5000/login.html`
3. Click the Google Sign-In button
4. You should now see the Google account selection screen

## Common Issues

### "redirect_uri_mismatch"
- Make sure you added `https://localhost:5000` to BOTH:
  - Authorized JavaScript origins
  - Authorized redirect URIs
- No trailing slash!

### Button doesn't appear
- Check browser console (F12) for errors
- Make sure you updated the Client ID in `js/auth.js`
- Clear browser cache and reload

### "This app isn't verified"
- This is normal for development
- Click "Advanced" > "Go to Hunt-Hunt-Planur (unsafe)"
- For production, you'll need to verify your app

## Environment Variables (Better for Production)

Instead of hardcoding credentials, use environment variables:

**Windows (PowerShell)**:
```powershell
$env:GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET="your-client-secret"
python app.py
```

**Linux/Mac**:
```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
python app.py
```

**Or create a `.env` file** (don't commit this!):
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

Then use `python-dotenv`:
```bash
pip install python-dotenv
```

Add to top of `app.py`:
```python
from dotenv import load_dotenv
load_dotenv()
```

## Need More Help?

See the full setup guide: [`GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md)
