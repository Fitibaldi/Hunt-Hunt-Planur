# Quick Start Guide 🚀

Get Hunt-Hunt-Planur running in 3 minutes!

## Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 2: Generate SSL Certificate

```bash
python generate_cert.py
```

You'll see:
```
✓ Certificate generated: cert.pem
✓ Private key generated: key.pem
```

## Step 3: Start the Server

```bash
python app.py
```

You'll see output like:
```
============================================================
🔒 Starting server with HTTPS (SSL enabled)
============================================================
Server running at: https://192.168.1.197:5000/
Local access: https://localhost:5000/

⚠️  IMPORTANT:
   - Your browser will show a security warning
   - Click 'Advanced' and 'Proceed' to accept the certificate
   - This is normal for self-signed certificates
============================================================
```

## Step 4: Access the Application

### On the Host Machine:
Open your browser and go to:
- `https://localhost:5000/` OR
- `https://192.168.1.197:5000/` (use your actual IP)

### On Other Devices (Phone, Tablet, etc.):
1. Make sure the device is on the **same WiFi network**
2. Open browser and go to: `https://192.168.1.197:5000/` (use the host machine's IP)

## Step 5: Accept the Security Warning

### Desktop Browser:
1. You'll see "Your connection is not private"
2. Click **"Advanced"**
3. Click **"Proceed to 192.168.1.197 (unsafe)"**

### Mobile Browser (iOS):
1. Tap **"Show Details"**
2. Tap **"visit this website"**
3. Tap **"Visit Website"** again

### Mobile Browser (Android):
1. Tap **"Advanced"**
2. Tap **"Proceed to 192.168.1.197 (unsafe)"**

## Step 6: Start Using!

### Create a Session:
1. Click **"Register"** to create an account (or **"Login"** if you have one)
2. From the dashboard, click **"Create New Session"**
3. Enter a session name
4. Share the 6-character code with others

### Join a Session:
1. Click **"Join as Guest"** on the homepage
2. Enter your name and the session code
3. Click **"Join Session"**

### Share Your Location:
1. Click **"Share Location"** button
2. Allow location access when prompted
3. Your location appears on the map!

## Troubleshooting

### "Only secure origins are allowed" error?
- Make sure you're using `https://` not `http://`
- Verify SSL certificates were generated (check for `cert.pem` and `key.pem` files)

### Can't connect from another device?
- Both devices must be on the same WiFi network
- Use the correct IP address (run `ipconfig` on Windows or `ifconfig` on Mac/Linux)
- Check firewall settings

### Location not working?
- Accept the security warning first
- Grant location permission when browser asks
- Make sure you're using HTTPS

## Need More Help?

- **Detailed HTTPS Setup**: See [HTTPS_SETUP.md](HTTPS_SETUP.md)
- **Full Documentation**: See [README.md](README.md)
- **Check Server Logs**: Look at the terminal where you ran `python app.py`

---

**That's it! You're ready to share locations in real-time! 🎉**
