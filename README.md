# Hunt-Hunt-Planur 🗺️

A real-time location sharing web application built with Flask (Python), HTML, CSS, and JavaScript. Share your location with friends and track everyone on an interactive map in real-time.

## Features

- 🔐 **User Authentication** - Register and login system with secure password hashing
- 🎯 **Session Management** - Create and manage location sharing sessions
- 👥 **Guest Access** - Join sessions without registration
- 📍 **Real-time Location Tracking** - Share and view locations on an interactive map
- 🗺️ **Interactive Map** - Powered by Leaflet.js and OpenStreetMap
- 🔒 **Secure Sessions** - Unique session codes for privacy
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Flask (Python 3.8+)
- **Database**: SQLite with SQLAlchemy ORM (no server needed!)
- **Map Library**: Leaflet.js
- **Map Tiles**: OpenStreetMap
- **SSL/TLS**: pyOpenSSL for HTTPS support

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser with geolocation support
- Network access for devices that need to connect

### Setup Instructions

1. **Clone or navigate to the project**
   ```bash
   cd c:/teodor/Projects/Hunt-Hunt-Planur
   ```

2. **Create a virtual environment (recommended)**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Generate SSL Certificate (Required for Geolocation)**
   ```bash
   python generate_cert.py
   ```
   
   This creates self-signed SSL certificates needed for the Geolocation API to work on non-localhost connections.
   
   📖 **See [HTTPS_SETUP.md](HTTPS_SETUP.md) for detailed HTTPS configuration guide**

5. **Start the Flask server**
   ```bash
   python app.py
   ```
   
   The server will automatically:
   - Create the SQLite database if it doesn't exist
   - Detect SSL certificates and enable HTTPS
   - Start on `https://0.0.0.0:5000` (accessible from network)

6. **Access the application**
   
   **From the host machine:**
   - `https://localhost:5000/`
   - `https://192.168.1.197:5000/` (use your actual IP)
   
   **From other devices on the network:**
   - `https://192.168.1.197:5000/` (use the host machine's IP)
   
   ⚠️ **Note**: You'll see a security warning because of the self-signed certificate. Click "Advanced" and "Proceed" to continue.

## Usage

### For Registered Users

1. **Register an Account**
   - Click "Register" on the homepage
   - Fill in username, email, and password
   - Submit the form

2. **Login**
   - Click "Login" on the homepage
   - Enter your credentials

3. **Create a Session**
   - From the dashboard, click "Create New Session"
   - Enter a session name
   - Share the generated session code with others

4. **Share Your Location**
   - Open the session
   - Click "Share Location" button
   - Allow browser location access
   - Your location will appear on the map

### For Guests

1. **Join a Session**
   - Click "Join as Guest" on the homepage
   - Enter your name and the session code
   - Click "Join Session"

2. **Share Your Location**
   - Click "Share Location" button
   - Allow browser location access
   - Your location will appear on the map

## Project Structure

```
Hunt-Hunt-Planur/
├── app.py                    # Main Flask application
├── config.py                 # Configuration settings
├── requirements.txt          # Python dependencies
├── database/                 # Database schema
│   └── schema.sql           # SQL schema (optional)
├── css/                      # Stylesheets
│   └── style.css            # Main stylesheet
├── js/                       # JavaScript files
│   ├── auth.js              # Authentication logic
│   ├── dashboard.js         # Dashboard functionality
│   ├── join.js              # Join session logic
│   └── session.js           # Session and map logic
├── dashboard.html           # User dashboard
├── index.html               # Homepage
├── join.html                # Guest join page
├── login.html               # Login page
├── register.html            # Registration page
├── session.html             # Session/map page
└── README.md                # This file
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `GET /api/logout` - User logout
- `GET /api/check_auth` - Check authentication status

### Session Management
- `POST /api/create_session` - Create new session
- `GET /api/get_sessions` - Get user's sessions
- `POST /api/end_session` - End a session
- `POST /api/join_session` - Join a session
- `GET /api/get_session_info` - Get session information
- `POST /api/leave_session` - Leave a session

### Location Tracking
- `POST /api/update_location` - Update participant location
- `GET /api/get_participants` - Get all session participants with locations
- `GET /api/get_participant_info` - Get participant details

## Database Models

### User
- Stores registered user accounts
- Fields: id, username, email, password_hash, created_at, last_login

### Session
- Stores location sharing sessions
- Fields: id, session_code, creator_id, session_name, created_at, is_active

### SessionParticipant
- Tracks users/guests in sessions
- Fields: id, session_id, user_id, guest_name, joined_at, is_active

### Location
- Stores real-time location updates
- Fields: id, participant_id, latitude, longitude, accuracy, timestamp

## Security Features

- Password hashing using Werkzeug's `generate_password_hash()`
- Flask session management with secure cookies
- SQL injection prevention using SQLAlchemy ORM
- Input validation on both client and server side
- CORS configuration for API security
- HTTPS recommended for production use

## Browser Compatibility

- Chrome 50+
- Firefox 45+
- Safari 10+
- Edge 14+
- Opera 37+

**Note**: Geolocation API requires HTTPS for non-localhost connections. See [HTTPS_SETUP.md](HTTPS_SETUP.md) for setup instructions.

## Network Access Setup

### Finding Your IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x)

**macOS/Linux:**
```bash
ifconfig
# or
ip addr show
```

### Firewall Configuration

If other devices can't connect, you may need to allow port 5000:

**Windows Firewall:**
```bash
netsh advfirewall firewall add rule name="Flask App" dir=in action=allow protocol=TCP localport=5000
```

**macOS:**
```bash
# System Preferences > Security & Privacy > Firewall > Firewall Options
# Add Python and allow incoming connections
```

**Linux (ufw):**
```bash
sudo ufw allow 5000/tcp
```

## Configuration

### Environment Variables

You can configure the application using environment variables:

- `SECRET_KEY` - Flask secret key for sessions (default: dev-secret-key-change-in-production)
- `DATABASE_URL` - Database connection string (default: SQLite)

### Configuration File

Edit [`config.py`](config.py) to change:
- Database connection settings
- Session cookie configuration
- CORS settings
- Development/Production modes

## Troubleshooting

### "Only secure origins are allowed" Error
- This means you're accessing via HTTP instead of HTTPS
- **Solution**: Generate SSL certificates and restart the server
  ```bash
  python generate_cert.py
  python app.py
  ```
- Access via `https://` not `http://`
- **📖 See [GEOLOCATION_FIX.md](GEOLOCATION_FIX.md) for complete step-by-step fix guide**
- Also see [HTTPS_SETUP.md](HTTPS_SETUP.md) for detailed HTTPS configuration

### Location not updating
- Ensure browser has location permission
- Check if HTTPS is enabled (required for non-localhost)
- Verify JavaScript console for errors
- Check Flask server logs
- Try accessing from `https://` URL

### Certificate/SSL Warnings
- Self-signed certificates will show security warnings
- Click "Advanced" → "Proceed to site (unsafe)"
- This is normal for development
- See [HTTPS_SETUP.md](HTTPS_SETUP.md) for mobile device instructions

### Can't connect from other devices
- Verify both devices are on the same WiFi network
- Check firewall settings (see Network Access Setup above)
- Confirm you're using the correct IP address
- Ensure you're using `https://` not `http://`
- Try accessing from the host machine first

### Database errors
- The app uses SQLite by default (no setup needed)
- Database file is created automatically as `hunt_planur.db`
- If you see database errors, delete `hunt_planur.db` and restart

### Session not found
- Verify session code is correct (case-sensitive)
- Check if session is still active in database
- Ensure Flask server is running

### Import errors
- Activate virtual environment
- Install all dependencies: `pip install -r requirements.txt`
- Check Python version: `python --version` (should be 3.8+)

## Development

### Running in Development Mode

```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Run with debug mode
python app.py
```

### Running in Production

```bash
# Use a production WSGI server like Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Future Enhancements

- WebSocket support for true real-time updates (Socket.IO)
- Location history and playback
- Custom map markers and colors
- Session expiration settings
- Mobile app version (React Native/Flutter)
- Export location data (CSV/JSON)
- Group messaging
- Geofencing and alerts
- Route tracking and distance calculation

## Dependencies

- **Flask** - Web framework
- **Flask-SQLAlchemy** - ORM for database operations
- **Flask-CORS** - Cross-Origin Resource Sharing
- **Werkzeug** - Password hashing and security utilities
- **pyOpenSSL** - SSL/TLS support for HTTPS

See [`requirements.txt`](requirements.txt) for complete list with versions.

## License

This project is open source and available for educational purposes.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Flask server logs
3. Check browser console for JavaScript errors
4. Verify database connection and tables

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

**Developed with ❤️ for real-time location sharing**

**Tech Stack**: Flask + Python + SQLite + Leaflet.js + JavaScript
