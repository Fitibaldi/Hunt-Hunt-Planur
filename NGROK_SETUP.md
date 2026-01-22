# Using ngrok for Google OAuth Development

Google OAuth requires a public HTTPS URL, which means `localhost` won't work for testing. This guide shows you how to use ngrok to create a secure tunnel to your local development server.

## What is ngrok?

ngrok creates a secure tunnel from a public URL to your local development server, allowing you to test OAuth flows that require HTTPS and public URLs.

## Step 1: Install ngrok

### Windows

**Option A - Download from website**:
1. Go to https://ngrok.com/download
2. Download the Windows version
3. Extract the ZIP file to a folder (e.g., `C:\ngrok`)
4. Add the folder to your PATH or run from that directory

**Option B - Using Chocolatey**:
```powershell
choco install ngrok
```

**Option C - Using Scoop**:
```powershell
scoop install ngrok
```

### Mac

```bash
brew install ngrok/ngrok/ngrok
```

### Linux

```bash
# Download and install
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

## Step 2: Sign Up for ngrok (Free)

1. Go to https://dashboard.ngrok.com/signup
2. Sign up for a free account
3. After signing in, go to https://dashboard.ngrok.com/get-started/your-authtoken
4. Copy your authtoken

## Step 3: Configure ngrok

Run this command with your authtoken:

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

## Step 4: Start Your Flask Application

Make sure your Flask app is running on port 5000:

```bash
python app.py
```

Your app should be running at `http://localhost:5000`

## Step 5: Start ngrok Tunnel

Open a **new terminal window** and run:

**If your Flask app is running with HTTP** (default):
```bash
ngrok http 5000
```

**If your Flask app is running with HTTPS** (using SSL certificates):
```bash
ngrok http https://localhost:5000
```

**Note**: If you're using the self-signed certificate from `generate_cert.py`, use the HTTPS command above.

You should see output like this:

```
ngrok

Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:5000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**IMPORTANT**: Copy the HTTPS forwarding URL (e.g., `https://abc123.ngrok-free.app`)

## Step 6: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Click on your OAuth 2.0 Client ID
4. Update the following:

   **Authorized JavaScript origins**:
   - Add your ngrok URL: `https://abc123.ngrok-free.app` (replace with your actual URL)
   
   **Authorized redirect URIs**:
   - Add your ngrok URL: `https://abc123.ngrok-free.app` (replace with your actual URL)

5. Click "SAVE"

## Step 7: Update Your Application Code

You don't need to change any code! Just access your application through the ngrok URL instead of localhost.

**Access your app at**: `https://abc123.ngrok-free.app` (use your actual ngrok URL)

## Step 8: Test Google OAuth

1. Open your browser and go to your ngrok URL (e.g., `https://abc123.ngrok-free.app/login.html`)
2. Click the Google Sign-In button
3. You should now be able to authenticate with Google!

## Important Notes

### ngrok Free Tier Limitations

- **URL changes on restart**: Each time you restart ngrok, you get a new URL
- **You'll need to update Google Cloud Console** with the new URL each time
- **Solution**: Upgrade to ngrok paid plan for a static domain, or use the free tier and update URLs as needed

### ngrok Warning Page

The first time someone visits your ngrok URL, they'll see a warning page:
```
You are about to visit: abc123.ngrok-free.app
This tunnel serves content from localhost:5000
```

Click "Visit Site" to continue. This is normal for the free tier.

### Keep Both Terminals Running

You need to keep TWO terminal windows open:
1. **Terminal 1**: Running your Flask app (`python app.py`)
2. **Terminal 2**: Running ngrok (`ngrok http https://localhost:5000` if using HTTPS, or `ngrok http 5000` if using HTTP)

## Troubleshooting

### "ERR_NGROK_3004" - Invalid or Incomplete HTTP Response

This error means your Flask app is running with HTTPS, but ngrok is trying to connect via HTTP.

**Solution**: Use the HTTPS command:
```bash
ngrok http https://localhost:5000
```

This is the correct command if you're using the self-signed certificate from `generate_cert.py`.

### "ERR_NGROK_3200" or Connection Refused

- Make sure your Flask app is running on port 5000
- If your app uses HTTPS (SSL certificates), use: `ngrok http https://localhost:5000`
- If your app uses HTTP, use: `ngrok http 5000`

### Google OAuth Still Not Working

1. **Check the URLs match exactly**:
   - The URL in Google Cloud Console
   - The URL you're accessing in your browser
   - No trailing slashes!

2. **Clear browser cache and cookies**

3. **Check ngrok is still running**:
   - ngrok sessions expire after inactivity
   - Restart ngrok if needed

### "redirect_uri_mismatch"

This means the URL in Google Cloud Console doesn't match the URL you're using:
- Copy the EXACT ngrok URL (including https://)
- Paste it in BOTH Authorized JavaScript origins AND Authorized redirect URIs
- No trailing slashes
- Click SAVE in Google Cloud Console
- Wait a minute for changes to propagate

## Alternative: ngrok Static Domain (Paid)

If you want a permanent URL that doesn't change:

1. Upgrade to ngrok paid plan ($8/month)
2. Get a static domain (e.g., `myapp.ngrok.app`)
3. Configure it once in Google Cloud Console
4. Never update it again!

Start ngrok with your static domain:
```bash
ngrok http --domain=myapp.ngrok.app 5000
```

## Production Deployment

ngrok is great for development, but for production you should:
1. Deploy to a real server (Heroku, AWS, DigitalOcean, etc.)
2. Use a real domain name
3. Set up proper HTTPS with Let's Encrypt
4. Update Google Cloud Console with your production URLs

## Quick Reference Commands

```bash
# Start Flask app (Terminal 1)
python app.py

# Start ngrok tunnel (Terminal 2)
# If using HTTPS (with SSL certificate):
ngrok http https://localhost:5000

# OR if using HTTP (no SSL):
ngrok http 5000

# View ngrok web interface (shows requests/responses)
# Open in browser: http://127.0.0.1:4040

# Stop ngrok
# Press Ctrl+C in the ngrok terminal
```

## Security Tips

1. **Don't share your ngrok URL publicly** - it exposes your local machine
2. **Stop ngrok when not testing** - close the tunnel when you're done
3. **Use environment variables** for sensitive data (Client ID, Secret)
4. **Never commit ngrok URLs** to version control

## Need Help?

- ngrok Documentation: https://ngrok.com/docs
- ngrok Dashboard: https://dashboard.ngrok.com/
- Check ngrok web interface at http://127.0.0.1:4040 for request logs
