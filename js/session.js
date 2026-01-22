// Session JavaScript - Real-time Location Sharing

let map;
let markers = {};
let participantId = null;
let sessionCode = null;
let isSharing = false;
let watchId = null;
let updateInterval = null;

// Get session code from URL
const urlParams = new URLSearchParams(window.location.search);
sessionCode = urlParams.get('code');

if (!sessionCode) {
    alert('No session code provided');
    window.location.href = 'index.html';
}

// Initialize map
function initMap() {
    try {
        map = L.map('map').setView([42.6977, 23.3219], 13); // Default to Sofia, Bulgaria
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        
        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Map initialization error:', error);
        showMessage('Failed to initialize map', 'error');
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

// Load session info
async function loadSessionInfo() {
    try {
        const response = await fetch(`/api/get_session_info?code=${sessionCode}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('sessionName').textContent = data.session.session_name;
            document.getElementById('sessionCode').textContent = sessionCode;
            
            // Get participant info
            const participantResponse = await fetch('/api/get_participant_info');
            const participantData = await participantResponse.json();
            
            if (participantData.success) {
                participantId = participantData.participant_id;
                document.getElementById('participantName').textContent = participantData.name;
            } else {
                // If not a participant yet, try to join automatically
                // This handles the case when a logged-in user opens an existing session
                const authResponse = await fetch('/api/check_auth');
                const authData = await authResponse.json();
                
                if (authData.authenticated) {
                    // User is logged in, join the session automatically
                    const joinResponse = await fetch('/api/join_session', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ session_code: sessionCode })
                    });
                    
                    const joinData = await joinResponse.json();
                    
                    if (joinData.success) {
                        participantId = joinData.participant_id;
                        // Reload participant info to get the name
                        const newParticipantResponse = await fetch('/api/get_participant_info');
                        const newParticipantData = await newParticipantResponse.json();
                        if (newParticipantData.success) {
                            document.getElementById('participantName').textContent = newParticipantData.name;
                        }
                    }
                }
            }
        } else {
            showMessage('Session not found', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Load session error:', error);
        showMessage('Failed to load session', 'error');
    }
}

// Get user's current location
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => resolve(position),
            error => reject(error),
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
        );
    });
}

// Start sharing location
async function startSharing() {
    // Check if using HTTPS (required for geolocation on remote devices)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        showMessage('⚠️ Geolocation requires HTTPS! Please access this page using https:// instead of http://', 'error');
        return;
    }
    
    if (!navigator.geolocation) {
        showMessage('Geolocation is not supported by your browser', 'error');
        return;
    }
    
    try {
        const position = await getCurrentLocation();
        isSharing = true;
        
        // Update button
        const toggleBtn = document.getElementById('toggleSharingBtn');
        toggleBtn.textContent = 'Stop Sharing';
        toggleBtn.classList.remove('btn-primary');
        toggleBtn.classList.add('btn-danger');
        
        // Watch position
        watchId = navigator.geolocation.watchPosition(
            updateLocation,
            handleLocationError,
            {
                enableHighAccuracy: true,
                timeout: 60000,  // 60 seconds - longer timeout to prevent premature stopping
                maximumAge: 5000  // Allow cached position up to 5 seconds old
            }
        );
        
        // Center map on user
        map.setView([position.coords.latitude, position.coords.longitude], 15);
        
        showMessage('Location sharing started', 'success');
    } catch (error) {
        showMessage('Failed to get location: ' + error.message, 'error');
    }
}

// Stop sharing location
function stopSharing() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    isSharing = false;
    
    // Update button
    const toggleBtn = document.getElementById('toggleSharingBtn');
    toggleBtn.textContent = 'Share Location';
    toggleBtn.classList.remove('btn-danger');
    toggleBtn.classList.add('btn-primary');
    
    showMessage('Location sharing stopped', 'info');
}

// Update location
async function updateLocation(position) {
    if (!isSharing || !participantId) return;
    
    const { latitude, longitude, accuracy } = position.coords;
    
    try {
        const response = await fetch('/api/update_location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_code: sessionCode,
                latitude,
                longitude,
                accuracy
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            console.error('Failed to update location:', data.message);
        }
    } catch (error) {
        console.error('Update location error:', error);
    }
}

// Handle location errors
function handleLocationError(error) {
    let message = 'Location error: ';
    let shouldStopSharing = false;
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message += 'Permission denied';
            // Check if it's due to insecure origin
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                message = 'Geolocation requires HTTPS. Please access via https:// instead of http://';
            }
            shouldStopSharing = true; // Stop on permission denied
            break;
        case error.POSITION_UNAVAILABLE:
            message += 'Position temporarily unavailable, retrying...';
            console.warn('Position unavailable, will retry');
            // Don't stop sharing, just log the error
            break;
        case error.TIMEOUT:
            message += 'Location request timeout, retrying...';
            console.warn('Geolocation timeout, will retry');
            // Don't stop sharing on timeout, watchPosition will retry automatically
            break;
        default:
            message += 'Unknown error';
            console.error('Unknown geolocation error:', error);
    }
    
    // Only show error message for critical errors
    if (shouldStopSharing) {
        showMessage(message, 'error');
        stopSharing();
    } else {
        // Just log non-critical errors to console
        console.log(message);
    }
}

// Load all participants and their locations
async function loadParticipants() {
    try {
        const response = await fetch(`/api/get_participants?code=${sessionCode}`);
        const data = await response.json();
        
        if (data.success) {
            updateParticipantsList(data.participants);
            updateMapMarkers(data.participants);
        }
    } catch (error) {
        console.error('Load participants error:', error);
    }
}

// Update participants list
function updateParticipantsList(participants) {
    const participantsList = document.getElementById('participantsList');
    const participantCount = document.getElementById('participantCount');
    
    participantCount.textContent = participants.length;
    
    participantsList.innerHTML = participants.map(p => {
        const isOnline = p.latitude && p.longitude;
        const lastUpdate = p.last_update ? new Date(p.last_update).toLocaleTimeString() : 'Never';
        
        return `
            <div class="participant-item ${isOnline ? '' : 'offline'}">
                <div class="participant-name">${p.name}</div>
                <div class="participant-status ${isOnline ? 'online' : ''}">
                    ${isOnline ? '🟢 Online' : '⚫ Offline'}
                </div>
                <div class="participant-status">
                    Last update: ${lastUpdate}
                </div>
            </div>
        `;
    }).join('');
}

// Update map markers
function updateMapMarkers(participants) {
    console.log('Updating map markers for participants:', participants);
    
    if (!map) {
        console.error('Map not initialized yet');
        return;
    }
    
    // Remove old markers
    Object.keys(markers).forEach(id => {
        if (!participants.find(p => p.id == id)) {
            map.removeLayer(markers[id]);
            delete markers[id];
        }
    });
    
    // Add/update markers
    participants.forEach(participant => {
        console.log(`Participant ${participant.name}: lat=${participant.latitude}, lng=${participant.longitude}`);
        
        if (participant.latitude && participant.longitude) {
            const lat = parseFloat(participant.latitude);
            const lng = parseFloat(participant.longitude);
            
            console.log(`Adding/updating marker for ${participant.name} at [${lat}, ${lng}]`);
            
            if (markers[participant.id]) {
                // Update existing marker
                markers[participant.id].setLatLng([lat, lng]);
                markers[participant.id].setPopupContent(participant.name);
            } else {
                // Create new marker with custom pin icon
                const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                const color = colors[participant.id % colors.length];
                
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `
                        <div style="position: relative; text-align: center;">
                            <div style="
                                background: ${color};
                                color: white;
                                padding: 8px 12px;
                                border-radius: 20px;
                                font-weight: bold;
                                box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                                white-space: nowrap;
                                font-size: 14px;
                                border: 3px solid white;
                            ">${participant.name}</div>
                            <div style="
                                width: 0;
                                height: 0;
                                border-left: 10px solid transparent;
                                border-right: 10px solid transparent;
                                border-top: 15px solid ${color};
                                margin: 0 auto;
                                filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
                            "></div>
                            <div style="
                                width: 12px;
                                height: 12px;
                                background: ${color};
                                border: 3px solid white;
                                border-radius: 50%;
                                margin: -3px auto 0;
                                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                            "></div>
                        </div>
                    `,
                    iconSize: [150, 80],
                    iconAnchor: [75, 80]
                });
                
                markers[participant.id] = L.marker([lat, lng], { icon })
                    .addTo(map)
                    .bindPopup(`<b>${participant.name}</b><br>Last update: ${new Date(participant.last_update).toLocaleTimeString()}`);
            }
        }
    });
}

// Center map on user
document.getElementById('centerMapBtn').addEventListener('click', async () => {
    try {
        const position = await getCurrentLocation();
        map.setView([position.coords.latitude, position.coords.longitude], 15);
    } catch (error) {
        showMessage('Failed to get your location', 'error');
    }
});

// Toggle sharing button
document.getElementById('toggleSharingBtn').addEventListener('click', () => {
    if (isSharing) {
        stopSharing();
    } else {
        startSharing();
    }
});

// Copy session code
document.getElementById('copyCodeBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(sessionCode);
    showMessage('Session code copied to clipboard!', 'success');
});

// Leave session
document.getElementById('leaveSessionBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to leave this session?')) {
        return;
    }
    
    stopSharing();
    
    try {
        await fetch('/api/leave_session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session_code: sessionCode })
        });
        
        // Check if user is logged in to determine redirect
        const authResponse = await fetch('/api/check_auth');
        const authData = await authResponse.json();
        
        if (authData.authenticated) {
            // Redirect to dashboard if logged in
            window.location.href = 'dashboard.html';
        } else {
            // Redirect to homepage if not logged in (guest)
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Leave session error:', error);
        // Default to homepage on error
        window.location.href = 'index.html';
    }
});

// Initialize
initMap();
loadSessionInfo();

// Start polling for participants updates
updateInterval = setInterval(loadParticipants, 3000); // Update every 3 seconds

// Initial load
loadParticipants();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopSharing();
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
