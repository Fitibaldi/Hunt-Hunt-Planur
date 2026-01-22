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
- **Database**: MySQL/MariaDB with SQLAlchemy ORM
- **Map Library**: Leaflet.js
- **Map Tiles**: OpenStreetMap

## Installation

### Prerequisites

- Python 3.8 or higher
- MySQL 5.7+ or MariaDB 10.3+
- pip (Python package manager)
- Modern web browser with geolocation support

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

4. **Create the database**
   - Open your MySQL/MariaDB client
   - Create the database:
   ```sql
   CREATE DATABASE hunt_planur;
   ```
   
   Alternatively, run the SQL script:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

5. **Configure database connection**
   - Edit [`config.py`](config.py) or set environment variables:
   ```bash
   # Windows
   set DB_HOST=localhost
   set DB_USER=root
   set DB_PASSWORD=your_password
   set DB_NAME=hunt_planur
   
   # macOS/Linux
   export DB_HOST=localhost
   export DB_USER=root
   export DB_PASSWORD=your_password
   export DB_NAME=hunt_planur
   ```

6. **Initialize the database tables**
   ```bash
   python
   >>> from app import app, db
   >>> with app.app_context():
   ...     db.create_all()
   >>> exit()
   ```

7. **Start the Flask server**
   ```bash
   python app.py
   ```
   
   The server will start on `http://localhost:5000`

8. **Access the application**
   - Open your browser and navigate to: `http://localhost:5000`

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

**Note**: Geolocation API requires HTTPS in production (except localhost)

## Configuration

### Environment Variables

You can configure the application using environment variables:

- `SECRET_KEY` - Flask secret key for sessions
- `DB_HOST` - Database host (default: localhost)
- `DB_USER` - Database username (default: root)
- `DB_PASSWORD` - Database password (default: empty)
- `DB_NAME` - Database name (default: hunt_planur)

### Configuration File

Edit [`config.py`](config.py) to change:
- Database connection settings
- Session cookie configuration
- CORS settings
- Development/Production modes

## Troubleshooting

### Location not updating
- Ensure browser has location permission
- Check if HTTPS is enabled (required for production)
- Verify JavaScript console for errors
- Check Flask server logs

### Database connection errors
- Verify database credentials in [`config.py`](config.py)
- Ensure MySQL/MariaDB service is running
- Check database exists: `SHOW DATABASES;`
- Verify PyMySQL is installed: `pip install PyMySQL`

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
- **PyMySQL** - MySQL database driver
- **Werkzeug** - Password hashing and security utilities

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

**Tech Stack**: Flask + Python + MySQL + Leaflet.js + JavaScript
