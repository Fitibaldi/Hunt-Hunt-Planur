# HTTPS Setup Guide for Hunt-Hunt-Planur

## Why HTTPS is Required

The Geolocation API in modern browsers requires a **secure context (HTTPS)** when accessed from non-localhost IP addresses. This is a security requirement to protect user privacy.

## Quick Setup Steps

### 1. Install Required Dependencies

```bash
pip install -r requirements.txt
```

This will install `pyOpenSSL` which is needed to generate SSL certificates.

### 2. Generate Self-Signed SSL Certificate

```bash
python generate_cert.py
```

This will create two files:
- `cert.pem` - SSL certificate
- `key.pem` - Private key

### 3. Start the Server

```bash
python app.py
```

The server will automatically detect the SSL certificates and run with HTTPS enabled.

### 4. Access the Application

**From the host machine:**
- `https://localhost:5000/`
- `https://192.168.1.197:5000/`

**From other devices on the network:**
- `https://192.168.1.197:5000/`

## Accepting Self-Signed Certificates

### Desktop Browsers (Chrome, Firefox, Edge)

1. Navigate to `https://192.168.1.197:5000/`
2. You'll see a security warning: "Your connection is not private"
3. Click **"Advanced"** or **"Show Details"**
4. Click **"Proceed to 192.168.1.197 (unsafe)"** or **"Accept the Risk and Continue"**
5. The certificate will be temporarily trusted for this session

### Mobile Devices (iOS/Android)

#### iOS (iPhone/iPad):
1. Open Safari and navigate to `https://192.168.1.197:5000/`
2. Tap **"Show Details"** on the warning page
3. Tap **"visit this website"**
4. Tap **"Visit Website"** again to confirm

For persistent trust:
1. Go to **Settings > General > About > Certificate Trust Settings**
2. Enable full trust for the certificate (if it appears there)

#### Android:
1. Open Chrome and navigate to `https://192.168.1.197:5000/`
2. Tap **"Advanced"**
3. Tap **"Proceed to 192.168.1.197 (unsafe)"**

## Troubleshooting

### Certificate Warnings Keep Appearing

This is normal for self-signed certificates. You need to accept the warning each time you:
- Clear browser cache/cookies
- Use a different browser
- Use a different device

### Geolocation Still Not Working

1. **Check HTTPS**: Ensure the URL starts with `https://` not `http://`
2. **Grant Permissions**: Allow location access when prompted by the browser
3. **Check Device Settings**: Ensure location services are enabled on your device
4. **Try Different Browser**: Some browsers handle self-signed certificates differently

### "NET::ERR_CERT_AUTHORITY_INVALID" Error

This is expected with self-signed certificates. Click "Advanced" and proceed anyway.

### Mobile Device Can't Connect

1. Ensure both devices are on the same WiFi network
2. Check firewall settings on the host machine
3. Verify the IP address is correct: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

## Production Deployment

⚠️ **IMPORTANT**: Self-signed certificates are for development only!

For production, use a proper SSL certificate from:
- **Let's Encrypt** (free, automated)
- **Cloudflare** (free with their service)
- Commercial certificate authorities

## Security Notes

- Self-signed certificates provide encryption but not identity verification
- Browsers will always show warnings for self-signed certificates
- Never use self-signed certificates in production
- The certificate is valid for 1 year from generation
- Regenerate certificates if your IP address changes

## Alternative: Using ngrok (No Certificate Needed)

If you don't want to deal with certificates, you can use ngrok:

```bash
# Install ngrok from https://ngrok.com/
ngrok http 5000
```

This creates a public HTTPS URL that tunnels to your local server.

## Questions?

If you encounter issues:
1. Check that port 5000 is not blocked by firewall
2. Verify the IP address matches your machine's local IP
3. Ensure all devices are on the same network
4. Try accessing from localhost first to verify the server works
