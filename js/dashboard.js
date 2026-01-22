// Dashboard JavaScript

// Check if user is logged in
async function checkAuth() {
    try {
        const response = await fetch('/api/check_auth');
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = 'login.html';
            return false;
        }
        
        // Display username
        document.getElementById('userDisplay').textContent = `Welcome, ${data.username}`;
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'login.html';
        return false;
    }
}

// Show message function
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Load user created sessions
async function loadSessions() {
    try {
        const response = await fetch('/api/get_sessions');
        const data = await response.json();
        
        const sessionsList = document.getElementById('sessionsList');
        
        if (data.success && data.sessions.length > 0) {
            sessionsList.innerHTML = data.sessions.map(session => `
                <div class="session-item">
                    <div class="session-details">
                        <h4>
                            <span class="session-name-display" data-code="${session.session_code}">${session.session_name}</span>
                            <button class="btn-icon" onclick="editSessionName('${session.session_code}', '${session.session_name.replace(/'/g, "\\'")}', event)" title="Edit name">✏️</button>
                            ${session.location_name ? ` <span style="color: #8b5cf6; font-size: 0.9rem;">📍 ${session.location_name}</span>` : ''}
                        </h4>
                        <p class="session-code">Code: ${session.session_code}</p>
                        <p class="session-meta">Created: ${new Date(session.created_at).toLocaleString()}</p>
                        <p class="session-meta">Participants: ${session.participant_count || 0}</p>
                    </div>
                    <div class="session-actions">
                        <a href="session.html?code=${session.session_code}" class="btn btn-primary btn-small">Open</a>
                        <button onclick="endSession('${session.session_code}')" class="btn btn-danger btn-small">End</button>
                    </div>
                </div>
            `).join('');
        } else {
            sessionsList.innerHTML = '<p class="loading">No created sessions. Create one to get started!</p>';
        }
    } catch (error) {
        console.error('Load sessions error:', error);
        showMessage('Failed to load sessions', 'error');
    }
}

// Load joined sessions
async function loadJoinedSessions() {
    try {
        console.log('Fetching joined sessions...');
        const response = await fetch('/api/get_joined_sessions');
        const data = await response.json();
        
        console.log('Joined sessions response:', data);
        
        const joinedSessionsList = document.getElementById('joinedSessionsList');
        
        if (data.success && data.sessions && data.sessions.length > 0) {
            console.log(`Found ${data.sessions.length} joined sessions`);
            // Log each session for debugging
            data.sessions.forEach(session => {
                console.log(`  - ${session.session_name} (${session.session_code}): active=${session.user_is_active}`);
            });
            
            joinedSessionsList.innerHTML = data.sessions.map(session => {
                const statusBadge = session.user_is_active
                    ? '<span style="color: #10b981; font-weight: bold;">● Active</span>'
                    : '<span style="color: #64748b; font-weight: bold;">○ Left</span>';
                
                return `
                    <div class="session-item">
                        <div class="session-details">
                            <h4>${session.session_name} ${statusBadge}${session.location_name ? ` <span style="color: #8b5cf6; font-size: 0.9rem;">📍 ${session.location_name}</span>` : ''}</h4>
                            <p class="session-code">Code: ${session.session_code}</p>
                            <p class="session-meta">Created by: ${session.creator_name}</p>
                            <p class="session-meta">Participants: ${session.participant_count || 0}</p>
                        </div>
                        <div class="session-actions">
                            <a href="session.html?code=${session.session_code}" class="btn btn-primary btn-small">
                                ${session.user_is_active ? 'Open' : 'Rejoin'}
                            </a>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            console.log('No joined sessions found or empty response');
            if (data.sessions) {
                console.log('Sessions array is empty:', data.sessions);
            }
            joinedSessionsList.innerHTML = '<p class="loading">No joined sessions. Join a session to see it here!</p>';
        }
    } catch (error) {
        console.error('Load joined sessions error:', error);
        showMessage('Failed to load joined sessions', 'error');
    }
}

// Create session modal
const createSessionBtn = document.getElementById('createSessionBtn');
const createSessionModal = document.getElementById('createSessionModal');
const closeModal = document.querySelector('.close');

createSessionBtn.addEventListener('click', () => {
    createSessionModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
    createSessionModal.classList.remove('active');
});

window.addEventListener('click', (e) => {
    if (e.target === createSessionModal) {
        createSessionModal.classList.remove('active');
    }
});

// Create session form handler
const createSessionForm = document.getElementById('createSessionForm');
createSessionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sessionName = document.getElementById('session_name').value;
    
    // Get user's location for reverse geocoding
    let latitude = null;
    let longitude = null;
    
    try {
        if (navigator.geolocation) {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 60000
                });
            });
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
        }
    } catch (geoError) {
        console.log('Could not get location for session naming:', geoError);
        // Continue without location - it's optional
    }
    
    try {
        const response = await fetch('/api/create_session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_name: sessionName,
                latitude,
                longitude
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Session created successfully! Redirecting...', 'success');
            createSessionModal.classList.remove('active');
            createSessionForm.reset();
            
            // Redirect to the session page to auto-start location sharing
            setTimeout(() => {
                window.location.href = `session.html?code=${data.session.session_code}`;
            }, 500);
        } else {
            showMessage(data.message || 'Failed to create session', 'error');
        }
    } catch (error) {
        showMessage('An error occurred. Please try again.', 'error');
        console.error('Create session error:', error);
    }
});

// Edit session name function
async function editSessionName(sessionCode, currentName, event) {
    event.stopPropagation();
    
    const newName = prompt('Enter new session name:', currentName);
    
    if (!newName || newName === currentName) {
        return;
    }
    
    if (newName.length < 3) {
        showMessage('Session name must be at least 3 characters', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/update_session_name', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_code: sessionCode,
                session_name: newName
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Session name updated successfully!', 'success');
            // Update the display
            const displayElement = document.querySelector(`.session-name-display[data-code="${sessionCode}"]`);
            if (displayElement) {
                displayElement.textContent = newName;
            }
        } else {
            showMessage(data.message || 'Failed to update session name', 'error');
        }
    } catch (error) {
        showMessage('An error occurred. Please try again.', 'error');
        console.error('Update session name error:', error);
    }
}

// End session function
async function endSession(sessionCode) {
    if (!confirm('Are you sure you want to end this session?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/end_session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session_code: sessionCode })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Session ended successfully', 'success');
            loadSessions();
        } else {
            showMessage(data.message || 'Failed to end session', 'error');
        }
    } catch (error) {
        showMessage('An error occurred. Please try again.', 'error');
        console.error('End session error:', error);
    }
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/logout');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Initialize
checkAuth().then(authenticated => {
    if (authenticated) {
        loadSessions();
        loadJoinedSessions();
    }
});
