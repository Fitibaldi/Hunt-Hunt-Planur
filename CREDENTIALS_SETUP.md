# Credentials Setup Guide

This guide explains how to set up your Google OAuth credentials securely.

## Important Security Note

**Never commit real credentials to version control!** The `.env` file is already in `.gitignore` to prevent accidental commits.

## Setup Steps

### 1. Install Dependencies

First, install the required Python packages including `python-dotenv`:

```bash
pip install -r requirements.txt
```

### 2. Create Your .env File

Copy the example file and add your real credentials:

```bash
# On Windows
copy .env.example .env

# On Linux/Mac
cp .env.example .env
```

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen if prompted
6. Choose "Web application" as the application type
7. Add authorized redirect URIs:
   - `http://localhost:5000/api/google_callback`
   - `https://localhost:5000/api/google_callback`
   - Add your production domain when deploying
8. Copy the Client ID and Client Secret

### 4. Update Your .env File

Edit the `.env` file and replace the placeholder values:

```env
# Flask Secret Key (generate a random string for production)
SECRET_KEY=your-secret-key-here

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

### 5. Verify Setup

The application will automatically load these credentials from the `.env` file when it starts.

## For Production

When deploying to production:

1. **Never** commit the `.env` file
2. Set environment variables directly on your hosting platform:
   - Heroku: Use `heroku config:set`
   - AWS: Use Systems Manager Parameter Store or Secrets Manager
   - Azure: Use App Settings
   - Other platforms: Check their documentation for environment variables

## Troubleshooting

If you see errors about missing credentials:

1. Verify the `.env` file exists in the project root
2. Check that `python-dotenv` is installed: `pip install python-dotenv`
3. Ensure the `.env` file has the correct format (no quotes around values unless they contain spaces)
4. Restart your Flask application after changing the `.env` file

## Files Overview

- `.env` - Your actual credentials (ignored by git)
- `.env.example` - Template with dummy values (committed to git)
- `config.py` - Loads credentials from environment variables
- `.gitignore` - Ensures `.env` is never committed
