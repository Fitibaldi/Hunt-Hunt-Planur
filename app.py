"""
Hunt-Hunt-Planur - Real-time Location Sharing Application
Flask Backend Server
"""

from flask import Flask, request, jsonify, session, send_from_directory, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import string
import random
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__, static_folder='.', static_url_path='')

# Load configuration
from config import config
app.config.from_object(config['development'])

db = SQLAlchemy(app)
CORS(app, supports_credentials=True)

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable for OAuth users
    google_id = db.Column(db.String(255), unique=True, nullable=True)  # Google OAuth ID
    profile_picture = db.Column(db.String(500), nullable=True)  # Profile picture URL
    auth_provider = db.Column(db.String(20), default='local')  # 'local' or 'google'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    sessions = db.relationship('Session', backref='creator', lazy=True)
    participants = db.relationship('SessionParticipant', backref='user', lazy=True)

class Session(db.Model):
    __tablename__ = 'sessions'
    id = db.Column(db.Integer, primary_key=True)
    session_code = db.Column(db.String(10), unique=True, nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    participants = db.relationship('SessionParticipant', backref='session', lazy=True, cascade='all, delete-orphan')

class SessionParticipant(db.Model):
    __tablename__ = 'session_participants'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('sessions.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    guest_name = db.Column(db.String(50), nullable=True)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    locations = db.relationship('Location', backref='participant', lazy=True, cascade='all, delete-orphan')

class Location(db.Model):
    __tablename__ = 'locations'
    id = db.Column(db.Integer, primary_key=True)
    participant_id = db.Column(db.Integer, db.ForeignKey('session_participants.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    accuracy = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# Helper Functions
def generate_session_code():
    """Generate a unique 6-character session code"""
    characters = string.ascii_uppercase + string.digits
    for _ in range(10):
        code = ''.join(random.choices(characters, k=6))
        if not Session.query.filter_by(session_code=code).first():
            return code
    return None

# Routes - Serve HTML files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(path):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')

# API Routes - Authentication
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    # Validation
    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    if len(username) < 3:
        return jsonify({'success': False, 'message': 'Username must be at least 3 characters'}), 400
    
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
    
    # Check if user exists
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Username already exists'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    
    # Create user
    password_hash = generate_password_hash(password)
    user = User(username=username, email=email, password_hash=password_hash)
    
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Registration successful'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required'}), 400
    
    # Find user by username or email
    user = User.query.filter((User.username == username) | (User.email == username)).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Set session
    session['user_id'] = user.id
    session['username'] = user.username
    session['email'] = user.email
    
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    })

@app.route('/api/logout', methods=['POST', 'GET'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/check_auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user_id': session['user_id'],
            'username': session['username'],
            'email': session['email']
        })
    return jsonify({'authenticated': False})

@app.route('/api/google_login', methods=['POST'])
def google_login():
    """Handle Google OAuth login"""
    data = request.get_json()
    token = data.get('credential')
    
    if not token:
        return jsonify({'success': False, 'message': 'No credential provided'}), 400
    
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            app.config['GOOGLE_CLIENT_ID']
        )
        
        # Get user info from token
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        picture = idinfo.get('picture', '')
        
        # Check if user exists
        user = User.query.filter_by(google_id=google_id).first()
        
        if not user:
            # Check if email already exists with local auth
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                # Link Google account to existing user
                existing_user.google_id = google_id
                existing_user.profile_picture = picture
                existing_user.auth_provider = 'google'
                user = existing_user
            else:
                # Create new user
                # Generate unique username from email
                base_username = email.split('@')[0]
                username = base_username
                counter = 1
                while User.query.filter_by(username=username).first():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = User(
                    username=username,
                    email=email,
                    google_id=google_id,
                    profile_picture=picture,
                    auth_provider='google',
                    password_hash=None  # No password for OAuth users
                )
                db.session.add(user)
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Set session
        session['user_id'] = user.id
        session['username'] = user.username
        session['email'] = user.email
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'profile_picture': user.profile_picture
            }
        })
        
    except ValueError as e:
        # Invalid token
        return jsonify({'success': False, 'message': 'Invalid Google token'}), 401
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Server error'}), 500

# API Routes - Session Management
@app.route('/api/create_session', methods=['POST'])
def create_session():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.get_json()
    session_name = data.get('session_name', '').strip()
    
    if not session_name:
        return jsonify({'success': False, 'message': 'Session name required'}), 400
    
    session_code = generate_session_code()
    if not session_code:
        return jsonify({'success': False, 'message': 'Failed to generate session code'}), 500
    
    # Create session
    new_session = Session(
        session_code=session_code,
        creator_id=session['user_id'],
        session_name=session_name
    )
    
    try:
        db.session.add(new_session)
        db.session.commit()
        
        # Add creator as participant
        participant = SessionParticipant(
            session_id=new_session.id,
            user_id=session['user_id']
        )
        db.session.add(participant)
        db.session.commit()
        
        # Store participant_id and session_code in session for later use
        session['participant_id'] = participant.id
        session['session_code'] = session_code
        
        return jsonify({
            'success': True,
            'message': 'Session created successfully',
            'session': {
                'id': new_session.id,
                'session_code': session_code,
                'session_name': session_name
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/api/get_sessions', methods=['GET'])
def get_sessions():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_sessions = Session.query.filter_by(
        creator_id=session['user_id'],
        is_active=True
    ).order_by(Session.created_at.desc()).all()
    
    sessions_data = []
    for s in user_sessions:
        participant_count = SessionParticipant.query.filter_by(
            session_id=s.id,
            is_active=True
        ).count()
        
        sessions_data.append({
            'id': s.id,
            'session_code': s.session_code,
            'session_name': s.session_name,
            'created_at': s.created_at.isoformat(),
            'is_active': s.is_active,
            'participant_count': participant_count,
            'is_creator': True
        })
    
    return jsonify({'success': True, 'sessions': sessions_data})

@app.route('/api/get_joined_sessions', methods=['GET'])
def get_joined_sessions():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    # Get sessions where user has been a participant (even if they left)
    # Show all active sessions they've joined, regardless of their current participation status
    joined_sessions = db.session.query(Session).join(
        SessionParticipant, Session.id == SessionParticipant.session_id
    ).filter(
        SessionParticipant.user_id == session['user_id'],
        # Removed is_active check for participant - show even if they left
        Session.is_active == True,  # Only show if session is still active
        Session.creator_id != session['user_id']  # Not the creator
    ).distinct().order_by(Session.created_at.desc()).all()
    
    print(f"DEBUG: User {session['user_id']} has joined {len(joined_sessions)} sessions")
    
    sessions_data = []
    for s in joined_sessions:
        creator = User.query.get(s.creator_id)
        participant_count = SessionParticipant.query.filter_by(
            session_id=s.id,
            is_active=True
        ).count()
        
        # Check if user is currently active in this session
        user_participant = SessionParticipant.query.filter_by(
            session_id=s.id,
            user_id=session['user_id']
        ).first()
        
        sessions_data.append({
            'id': s.id,
            'session_code': s.session_code,
            'session_name': s.session_name,
            'created_at': s.created_at.isoformat(),
            'is_active': s.is_active,
            'participant_count': participant_count,
            'is_creator': False,
            'creator_name': creator.username if creator else 'Unknown',
            'user_is_active': user_participant.is_active if user_participant else False
        })
    
    return jsonify({'success': True, 'sessions': sessions_data})

@app.route('/api/get_all_sessions_history', methods=['GET'])
def get_all_sessions_history():
    """Get all sessions (created and joined) for the logged-in user, including ended ones"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    # Get all sessions created by user
    created_sessions = Session.query.filter_by(
        creator_id=session['user_id']
    ).order_by(Session.created_at.desc()).all()
    
    # Get all sessions joined by user (including ended ones)
    joined_sessions = db.session.query(Session).join(
        SessionParticipant, Session.id == SessionParticipant.session_id
    ).filter(
        SessionParticipant.user_id == session['user_id'],
        Session.creator_id != session['user_id']  # Not the creator
    ).distinct().order_by(Session.created_at.desc()).all()
    
    sessions_data = []
    
    # Add created sessions
    for s in created_sessions:
        # Get unique participants (count distinct user_id and guest_name combinations)
        # For registered users, count by user_id; for guests, count by guest_name
        all_participants = SessionParticipant.query.filter_by(session_id=s.id).all()
        unique_participants = set()
        for p in all_participants:
            if p.user_id:
                unique_participants.add(('user', p.user_id))
            else:
                unique_participants.add(('guest', p.guest_name))
        max_participant_count = len(unique_participants)
        
        # Get currently active unique participants
        active_participants = SessionParticipant.query.filter_by(
            session_id=s.id,
            is_active=True
        ).all()
        active_unique_participants = set()
        for p in active_participants:
            if p.user_id:
                active_unique_participants.add(('user', p.user_id))
            else:
                active_unique_participants.add(('guest', p.guest_name))
        active_participant_count = len(active_unique_participants)
        
        sessions_data.append({
            'id': s.id,
            'session_code': s.session_code,
            'session_name': s.session_name,
            'created_at': s.created_at.isoformat(),
            'is_active': s.is_active,
            'participant_count': max_participant_count,
            'active_participant_count': active_participant_count,
            'is_creator': True,
            'user_is_active': True  # Creator is always considered active if session is active
        })
    
    # Add joined sessions
    for s in joined_sessions:
        creator = User.query.get(s.creator_id)
        
        # Get unique participants
        all_participants = SessionParticipant.query.filter_by(session_id=s.id).all()
        unique_participants = set()
        for p in all_participants:
            if p.user_id:
                unique_participants.add(('user', p.user_id))
            else:
                unique_participants.add(('guest', p.guest_name))
        max_participant_count = len(unique_participants)
        
        # Get currently active unique participants
        active_participants = SessionParticipant.query.filter_by(
            session_id=s.id,
            is_active=True
        ).all()
        active_unique_participants = set()
        for p in active_participants:
            if p.user_id:
                active_unique_participants.add(('user', p.user_id))
            else:
                active_unique_participants.add(('guest', p.guest_name))
        active_participant_count = len(active_unique_participants)
        
        # Check if user is currently active in this session
        user_participant = SessionParticipant.query.filter_by(
            session_id=s.id,
            user_id=session['user_id']
        ).first()
        
        sessions_data.append({
            'id': s.id,
            'session_code': s.session_code,
            'session_name': s.session_name,
            'created_at': s.created_at.isoformat(),
            'is_active': s.is_active,
            'participant_count': max_participant_count,
            'active_participant_count': active_participant_count,
            'is_creator': False,
            'creator_name': creator.username if creator else 'Unknown',
            'user_is_active': user_participant.is_active if user_participant else False,
            'joined_at': user_participant.joined_at.isoformat() if user_participant else None
        })
    
    # Sort all sessions by created_at descending
    sessions_data.sort(key=lambda x: x['created_at'], reverse=True)
    
    return jsonify({'success': True, 'sessions': sessions_data})

@app.route('/api/end_session', methods=['POST'])
def end_session():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.get_json()
    session_code = data.get('session_code', '')
    
    user_session = Session.query.filter_by(
        session_code=session_code,
        creator_id=session['user_id']
    ).first()
    
    if not user_session:
        return jsonify({'success': False, 'message': 'Session not found or unauthorized'}), 404
    
    try:
        user_session.is_active = False
        
        # Deactivate all participants
        SessionParticipant.query.filter_by(session_id=user_session.id).update({'is_active': False})
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Session ended successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/api/join_session', methods=['POST'])
def join_session():
    data = request.get_json()
    
    session_code = data.get('session_code', '').upper()
    guest_name = data.get('guest_name', '').strip() if 'guest_name' in data else None
    user_id = session.get('user_id')
    
    if not user_id and not guest_name:
        return jsonify({'success': False, 'message': 'Guest name required'}), 400
    
    # Find session
    user_session = Session.query.filter_by(session_code=session_code, is_active=True).first()
    
    if not user_session:
        return jsonify({'success': False, 'message': 'Session not found or inactive'}), 404
    
    # Check if already a participant
    if user_id:
        existing = SessionParticipant.query.filter_by(
            session_id=user_session.id,
            user_id=user_id,
            is_active=True
        ).first()
    else:
        existing = SessionParticipant.query.filter_by(
            session_id=user_session.id,
            guest_name=guest_name,
            is_active=True
        ).first()
    
    if existing:
        session['participant_id'] = existing.id
        session['session_code'] = session_code
        return jsonify({
            'success': True,
            'message': 'Already joined session',
            'participant_id': existing.id
        })
    
    # Add as new participant
    participant = SessionParticipant(
        session_id=user_session.id,
        user_id=user_id,
        guest_name=guest_name
    )
    
    try:
        db.session.add(participant)
        db.session.commit()
        
        session['participant_id'] = participant.id
        session['session_code'] = session_code
        if guest_name:
            session['guest_name'] = guest_name
        
        return jsonify({
            'success': True,
            'message': 'Joined session successfully',
            'participant_id': participant.id,
            'session_name': user_session.session_name
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/api/get_session_info', methods=['GET'])
def get_session_info():
    session_code = request.args.get('code', '').upper()
    
    user_session = Session.query.filter_by(session_code=session_code, is_active=True).first()
    
    if not user_session:
        return jsonify({'success': False, 'message': 'Session not found'}), 404
    
    creator = User.query.get(user_session.creator_id)
    
    return jsonify({
        'success': True,
        'session': {
            'id': user_session.id,
            'session_code': user_session.session_code,
            'session_name': user_session.session_name,
            'created_at': user_session.created_at.isoformat(),
            'creator_id': user_session.creator_id,
            'creator_name': creator.username if creator else None
        }
    })

@app.route('/api/get_participant_info', methods=['GET'])
def get_participant_info():
    if 'participant_id' not in session:
        return jsonify({'success': False, 'message': 'Not a participant'}), 401
    
    participant = SessionParticipant.query.get(session['participant_id'])
    
    if not participant:
        return jsonify({'success': False, 'message': 'Participant not found'}), 404
    
    name = participant.user.username if participant.user else participant.guest_name
    
    return jsonify({
        'success': True,
        'participant_id': participant.id,
        'name': name,
        'is_guest': participant.user_id is None
    })

@app.route('/api/update_location', methods=['POST'])
def update_location():
    if 'participant_id' not in session:
        return jsonify({'success': False, 'message': 'Not a participant'}), 401
    
    data = request.get_json()
    
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    accuracy = data.get('accuracy')
    
    if latitude is None or longitude is None:
        return jsonify({'success': False, 'message': 'Latitude and longitude required'}), 400
    
    # Validate coordinates
    if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
        return jsonify({'success': False, 'message': 'Invalid coordinates'}), 400
    
    location = Location(
        participant_id=session['participant_id'],
        latitude=latitude,
        longitude=longitude,
        accuracy=accuracy
    )
    
    try:
        db.session.add(location)
        db.session.commit()
        
        # Clean up old locations (keep last 100)
        old_locations = Location.query.filter_by(
            participant_id=session['participant_id']
        ).order_by(Location.timestamp.desc()).offset(100).all()
        
        for old_loc in old_locations:
            db.session.delete(old_loc)
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Location updated'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/api/get_participants', methods=['GET'])
def get_participants():
    session_code = request.args.get('code', '').upper()
    
    user_session = Session.query.filter_by(session_code=session_code, is_active=True).first()
    
    if not user_session:
        return jsonify({'success': False, 'message': 'Session not found'}), 404
    
    participants = SessionParticipant.query.filter_by(
        session_id=user_session.id,
        is_active=True
    ).order_by(SessionParticipant.joined_at).all()
    
    participants_data = []
    for p in participants:
        # Get latest location
        latest_location = Location.query.filter_by(
            participant_id=p.id
        ).order_by(Location.timestamp.desc()).first()
        
        name = p.user.username if p.user else p.guest_name
        
        # Check if location is stale (older than 30 seconds) - consider as offline
        is_online = False
        if latest_location:
            time_diff = (datetime.utcnow() - latest_location.timestamp).total_seconds()
            is_online = time_diff < 30
        
        participants_data.append({
            'id': p.id,
            'name': name,
            'is_guest': p.user_id is None,
            'latitude': latest_location.latitude if latest_location and is_online else None,
            'longitude': latest_location.longitude if latest_location and is_online else None,
            'accuracy': latest_location.accuracy if latest_location else None,
            'last_update': latest_location.timestamp.isoformat() if latest_location else None,
            'is_online': is_online
        })
    
    return jsonify({'success': True, 'participants': participants_data})

@app.route('/api/stop_sharing', methods=['POST'])
def stop_sharing():
    """Mark user as offline by clearing their location data"""
    if 'participant_id' not in session:
        return jsonify({'success': False, 'message': 'Not a participant'}), 401
    
    try:
        # Delete all locations for this participant to mark them as offline
        Location.query.filter_by(participant_id=session['participant_id']).delete()
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Stopped sharing location'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/api/leave_session', methods=['POST'])
def leave_session():
    if 'participant_id' not in session:
        return jsonify({'success': False, 'message': 'Not a participant'}), 401
    
    participant = SessionParticipant.query.get(session['participant_id'])
    
    if participant:
        try:
            # Clear location data when leaving
            Location.query.filter_by(participant_id=session['participant_id']).delete()
            
            participant.is_active = False
            db.session.commit()
            
            # Clear session data
            session.pop('participant_id', None)
            session.pop('session_code', None)
            session.pop('guest_name', None)
            
            return jsonify({'success': True, 'message': 'Left session successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': 'Server error'}), 500
    
    return jsonify({'success': False, 'message': 'Participant not found'}), 404

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    # Check if SSL certificates exist
    import os
    import socket
    
    def get_local_ip():
        """Get the local IP address of this machine"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
            return local_ip
        except Exception:
            return "127.0.0.1"
    
    local_ip = get_local_ip()
    cert_file = 'cert.pem'
    key_file = 'key.pem'
    
    if os.path.exists(cert_file) and os.path.exists(key_file):
        print("=" * 60)
        print("🔒 Starting server with HTTPS (SSL enabled)")
        print("=" * 60)
        print(f"Server running at: https://{local_ip}:5000/")
        print(f"Local access: https://localhost:5000/")
        print("\n⚠️  IMPORTANT:")
        print("   - Your browser will show a security warning")
        print("   - Click 'Advanced' and 'Proceed' to accept the certificate")
        print("   - This is normal for self-signed certificates")
        print("   - On mobile devices, you must accept the certificate warning")
        print("=" * 60)
        
        # Run with SSL context
        app.run(
            debug=True,
            host='0.0.0.0',
            port=5000,
            ssl_context=(cert_file, key_file)
        )
    else:
        print("=" * 60)
        print("⚠️  WARNING: Running without HTTPS")
        print("=" * 60)
        print("Geolocation API requires HTTPS for non-localhost connections.")
        print(f"\nTo enable HTTPS:")
        print(f"1. Install pyOpenSSL: pip install pyOpenSSL")
        print(f"2. Run: python generate_cert.py")
        print(f"3. Restart the server")
        print(f"\nYour local IP is: {local_ip}")
        print("=" * 60)
        
        # Run without SSL
        app.run(debug=True, host='0.0.0.0', port=5000)
