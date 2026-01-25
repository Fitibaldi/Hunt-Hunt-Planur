// Session JavaScript - Real-time Location Sharing

let map;
let markers = {};
let participantId = null;
let sessionCode = null;
let isSharing = false;
let watchId = null;
let updateInterval = null;
let positionUpdateInterval = null; // Interval for sending position updates every 1 minute
let isCreator = false;
let creatorId = null;
let currentUserId = null;
let temporaryMarker = null; // For showing offline user's last location
let participantsData = []; // Store all participants data including offline ones
let lastPosition = null; // Store last known position
let trackMarkers = []; // Store track markers for position history
let trackPolyline = null; // Store polyline for track path

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
            // Store session name for editing
            window.currentSessionName = data.session.session_name;
            
            let sessionTitle = data.session.session_name;
            if (data.session.location_name) {
                sessionTitle += ` 📍 ${data.session.location_name}`;
            }
            document.getElementById('sessionName').textContent = sessionTitle;
            document.getElementById('sessionCode').textContent = sessionCode;
            
            // Store creator info
            creatorId = data.session.creator_id;
            
            // Get participant info
            const participantResponse = await fetch('/api/get_participant_info');
            const participantData = await participantResponse.json();
            
            if (participantData.success) {
                participantId = participantData.participant_id;
                currentUserId = participantData.user_id;
                document.getElementById('participantName').textContent = participantData.name;
                
                // Check if current user is the creator
                isCreator = (currentUserId && currentUserId === creatorId);
                
                // Show edit button for creator
                if (isCreator) {
                    document.getElementById('editSessionNameBtn').style.display = 'inline-block';
                }
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
        
        // Watch position for real-time updates (for map display)
        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                // Store the latest position
                lastPosition = pos;
            },
            handleLocationError,
            {
                enableHighAccuracy: true,
                timeout: 60000,  // 60 seconds
                maximumAge: 5000  // Allow cached position up to 5 seconds old
            }
        );
        
        // Send initial position update
        await updateLocation(position);
        
        // Set up interval to send position updates every 1 minute
        positionUpdateInterval = setInterval(async () => {
            if (isSharing && lastPosition) {
                await updateLocation(lastPosition);
            }
        }, 60000); // 60000ms = 1 minute
        
        // Center map on user
        map.setView([position.coords.latitude, position.coords.longitude], 15);
        
        showMessage('Location sharing started (updates every 1 minute)', 'success');
    } catch (error) {
        showMessage('Failed to get location: ' + error.message, 'error');
    }
}

// Stop sharing location
async function stopSharing() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    // Clear position update interval
    if (positionUpdateInterval !== null) {
        clearInterval(positionUpdateInterval);
        positionUpdateInterval = null;
    }
    
    isSharing = false;
    lastPosition = null;
    
    // Notify server to mark as offline
    try {
        await fetch('/api/stop_sharing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        console.error('Failed to notify server about stopping location sharing:', error);
    }
    
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
            // Store participants data for later use
            participantsData = data.participants;
            
            // Check if current participant is still in the list
            const stillInSession = data.participants.some(p => p.id === participantId);
            
            if (!stillInSession && participantId) {
                // User was removed from the session
                showMessage('You have been removed from this session', 'error');
                
                // Stop sharing location
                if (isSharing) {
                    stopSharing();
                }
                
                // Redirect based on user type
                setTimeout(async () => {
                    const authResponse = await fetch('/api/check_auth');
                    const authData = await authResponse.json();
                    
                    if (authData.authenticated) {
                        // Redirect to dashboard if logged in
                        window.location.href = 'dashboard.html';
                    } else {
                        // Redirect to homepage if guest
                        window.location.href = 'index.html';
                    }
                }, 2000);
                
                return;
            }
            
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
    
    console.log('Updating participants list. isCreator:', isCreator, 'creatorId:', creatorId);
    
    participantsList.innerHTML = participants.map(p => {
        // Use is_online flag from server if available, otherwise check for coordinates
        const isOnline = p.is_online !== undefined ? p.is_online : (p.latitude && p.longitude);
        const lastUpdate = p.last_update ? new Date(p.last_update).toLocaleTimeString() : 'Never';
        
        // Check if this participant can be removed (creator can remove others, but not themselves)
        const canRemove = isCreator && p.user_id !== creatorId;
        
        console.log(`Participant ${p.name}: isOnline=${isOnline}, canRemove=${canRemove}, user_id=${p.user_id}`);
        
        // Check if offline user has last known location
        const hasLastLocation = !isOnline && p.latitude && p.longitude;
        
        // Check if this is the current user
        const isCurrentUser = p.id === participantId;
        
        return `
            <div class="participant-item ${isOnline ? '' : 'offline'} ${isCurrentUser ? 'current-user' : ''}" data-participant-id="${p.id}" style="cursor: ${(isOnline || hasLastLocation) ? 'pointer' : 'default'};">
                ${p.profile_picture ? `
                    <img src="${p.profile_picture}"
                         alt="${p.name}"
                         class="participant-avatar"
                         onerror="this.style.display='none'">
                ` : ''}
                <div class="participant-info">
                    <div class="participant-name">
                        ${p.name}
                        ${p.user_id === creatorId ? ' 👑' : ''}
                        ${isCurrentUser ? ' <img src="img/hunt-hunt-planur-48p.webp" alt="You" style="width: 20px; height: 20px; vertical-align: middle;" title="You">' : ''}
                    </div>
                    <div class="participant-status ${isOnline ? 'online' : ''}">
                        ${isOnline ? '🟢 Sharing Location' : '⚫ Offline'}
                    </div>
                    <div class="participant-status">
                        Last update: ${lastUpdate}
                    </div>
                    ${hasLastLocation ? '<div class="participant-status" style="font-size: 0.75rem; color: #8b5cf6;">📍 Click to see last location</div>' : ''}
                </div>
                ${(canRemove || isOnline || hasLastLocation) ? `
                    <div class="participant-menu-container">
                        <button class="participant-menu-btn" data-participant-id="${p.id}" title="Actions">⋮</button>
                        <div class="participant-menu-dropdown" data-participant-id="${p.id}">
                            ${(isOnline || hasLastLocation) ? `
                                <button class="menu-item" data-action="track" data-participant-id="${p.id}" data-participant-name="${p.name}">
                                    📌 Track
                                </button>
                            ` : ''}
                            ${canRemove ? `
                                <button class="menu-item menu-item-danger" data-action="remove" data-participant-id="${p.id}" data-participant-name="${p.name}">
                                    🗑️ Remove User
                                </button>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    // Add click handlers to participants
    participants.forEach(p => {
        const isOnline = p.is_online !== undefined ? p.is_online : (p.latitude && p.longitude);
        const hasLastLocation = !isOnline && p.latitude && p.longitude;
        const element = participantsList.querySelector(`[data-participant-id="${p.id}"]`);
        
        if (element) {
            // Add click handler for online participants - center on their marker
            if (isOnline && p.latitude && p.longitude) {
                element.addEventListener('click', (e) => {
                    // Don't trigger if clicking on menu button or menu items
                    if (e.target.closest('.participant-menu-container')) {
                        return;
                    }
                    centerMapOnParticipant(p.id);
                });
            }
            
            // Add click handler for offline participants with last location - show temporary marker
            if (hasLastLocation) {
                element.addEventListener('click', (e) => {
                    // Don't trigger if clicking on menu button or menu items
                    if (e.target.closest('.participant-menu-container')) {
                        return;
                    }
                    showLastLocation(p);
                });
            }
            
            // Add click handler for menu button
            const menuBtn = element.querySelector('.participant-menu-btn');
            if (menuBtn) {
                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleParticipantMenu(p.id);
                });
            }
            
            // Add click handlers for menu items
            const menuItems = element.querySelectorAll('.menu-item');
            menuItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = item.dataset.action;
                    const participantId = item.dataset.participantId;
                    const participantName = item.dataset.participantName;
                    
                    if (action === 'remove') {
                        removeParticipant(participantId, participantName);
                    } else if (action === 'track') {
                        showUserTrack(participantId, participantName);
                    }
                    
                    // Close all menus
                    closeAllMenus();
                });
            });
        }
    });
}

// Toggle participant menu dropdown
function toggleParticipantMenu(participantId) {
    const dropdown = document.querySelector(`.participant-menu-dropdown[data-participant-id="${participantId}"]`);
    
    if (!dropdown) return;
    
    // Close all other menus first
    closeAllMenus();
    
    // Toggle this menu
    dropdown.classList.toggle('show');
}

// Close all participant menus
function closeAllMenus() {
    document.querySelectorAll('.participant-menu-dropdown').forEach(menu => {
        menu.classList.remove('show');
    });
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.participant-menu-container')) {
        closeAllMenus();
    }
});

// Show last known location for offline participant
function showLastLocation(participant) {
    if (!participant.latitude || !participant.longitude) {
        showMessage('No location data available for this participant', 'error');
        return;
    }
    
    // Remove previous temporary marker if exists
    if (temporaryMarker) {
        map.removeLayer(temporaryMarker);
    }
    
    const lat = parseFloat(participant.latitude);
    const lng = parseFloat(participant.longitude);
    
    // Build marker content with profile picture if available
    let markerContent = '';
    if (participant.profile_picture) {
        markerContent = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${participant.profile_picture}"
                     style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid white;"
                     onerror="this.style.display='none'">
                <span>${participant.name} (Last Location)</span>
            </div>
        `;
    } else {
        markerContent = `${participant.name} (Last Location)`;
    }
    
    // Create a semi-transparent marker for last known location
    const icon = L.divIcon({
        className: 'custom-marker temporary-marker',
        html: `
            <div style="position: relative; text-align: center; opacity: 0.6;">
                <div style="
                    background: #64748b;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 20px;
                    font-weight: bold;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                    white-space: nowrap;
                    font-size: 14px;
                    border: 3px solid white;
                ">${markerContent}</div>
                <div style="
                    width: 0;
                    height: 0;
                    border-left: 10px solid transparent;
                    border-right: 10px solid transparent;
                    border-top: 15px solid #64748b;
                    margin: 0 auto;
                    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
                "></div>
                <div style="
                    width: 12px;
                    height: 12px;
                    background: #64748b;
                    border: 3px solid white;
                    border-radius: 50%;
                    margin: -3px auto 0;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                "></div>
            </div>
        `,
        iconSize: [200, 80],
        iconAnchor: [100, 80]
    });
    
    const lastUpdate = participant.last_update ? new Date(participant.last_update).toLocaleString() : 'Unknown';
    
    temporaryMarker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
            <b>${participant.name}</b><br>
            <span style="color: #64748b;">Last known location</span><br>
            Last update: ${lastUpdate}
        `)
        .openPopup();
    
    // Center map on the location
    map.setView([lat, lng], 16);
    
    showMessage(`Showing last known location of ${participant.name}`, 'info');
    
    // Auto-remove temporary marker after 10 seconds
    setTimeout(() => {
        if (temporaryMarker) {
            map.removeLayer(temporaryMarker);
            temporaryMarker = null;
        }
    }, 10000);
}

// Remove participant (creator only)
async function removeParticipant(participantId, participantName) {
    if (!isCreator) {
        showMessage('Only the session creator can remove participants', 'error');
        return;
    }
    
    if (!confirm(`Remove ${participantName} from the session?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/remove_participant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ participant_id: participantId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(`${participantName} has been removed from the session`, 'success');
            loadParticipants(); // Refresh the list
        } else {
            showMessage(data.message || 'Failed to remove participant', 'error');
        }
    } catch (error) {
        console.error('Remove participant error:', error);
        showMessage('Failed to remove participant', 'error');
    }
}

// Show user track (position history)
async function showUserTrack(participantId, participantName) {
    try {
        // Clear any existing track markers and polyline
        clearTrackMarkers();
        
        // Fetch position history
        const response = await fetch(`/api/get_user_positions?participant_id=${participantId}&session_code=${sessionCode}`);
        const data = await response.json();
        
        if (!data.success) {
            showMessage(data.message || 'Failed to load position history', 'error');
            return;
        }
        
        if (!data.positions || data.positions.length === 0) {
            showMessage(`No position history available for ${participantName}`, 'info');
            return;
        }
        
        const positions = data.positions;
        const latLngs = [];
        
        // Create markers for each position
        positions.forEach((pos, index) => {
            const lat = parseFloat(pos.latitude);
            const lng = parseFloat(pos.longitude);
            latLngs.push([lat, lng]);
            
            const timestamp = new Date(pos.timestamp).toLocaleString();
            const isLast = index === positions.length - 1;
            
            // Create pin marker with emoji
            const icon = L.divIcon({
                className: 'track-marker',
                html: `
                    <div style="
                        font-size: 24px;
                        text-align: center;
                        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                        ${isLast ? 'animation: pulse 2s infinite;' : ''}
                    ">📌</div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 24]
            });
            
            const marker = L.marker([lat, lng], { icon })
                .addTo(map)
                .bindTooltip(`
                    <b>${participantName}</b><br>
                    ${timestamp}${isLast ? '<br><span style="color: #10b981;">📍 Last known location</span>' : ''}
                `, {
                    permanent: false,
                    direction: 'top'
                });
            
            trackMarkers.push(marker);
        });
        
        // Draw polyline connecting all positions
        if (latLngs.length > 1) {
            trackPolyline = L.polyline(latLngs, {
                color: '#8b5cf6',
                weight: 3,
                opacity: 0.7,
                dashArray: '10, 5'
            }).addTo(map);
        }
        
        // Fit map to show all positions
        if (latLngs.length > 0) {
            const bounds = L.latLngBounds(latLngs);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
        
        showMessage(`Showing ${positions.length} location${positions.length > 1 ? 's' : ''} for ${participantName}`, 'success');
        
    } catch (error) {
        console.error('Show user track error:', error);
        showMessage('Failed to load position history', 'error');
    }
}

// Clear track markers and polyline
function clearTrackMarkers() {
    // Remove all track markers
    trackMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    trackMarkers = [];
    
    // Remove polyline
    if (trackPolyline) {
        map.removeLayer(trackPolyline);
        trackPolyline = null;
    }
}

// Update map markers
function updateMapMarkers(participants) {
    console.log('Updating map markers for participants:', participants);
    
    if (!map) {
        console.error('Map not initialized yet');
        return;
    }
    
    // Remove old markers for participants who are no longer in the list or are offline
    Object.keys(markers).forEach(id => {
        const participant = participants.find(p => p.id == id);
        const isOnline = participant && (participant.is_online !== undefined ? participant.is_online : (participant.latitude && participant.longitude));
        
        if (!participant || !isOnline) {
            map.removeLayer(markers[id]);
            delete markers[id];
        }
    });
    
    // Add/update markers only for online participants
    participants.forEach(participant => {
        const isOnline = participant.is_online !== undefined ? participant.is_online : (participant.latitude && participant.longitude);
        
        console.log(`Participant ${participant.name}: lat=${participant.latitude}, lng=${participant.longitude}, online=${isOnline}`);
        
        if (isOnline && participant.latitude && participant.longitude) {
            const lat = parseFloat(participant.latitude);
            const lng = parseFloat(participant.longitude);
            
            console.log(`Adding/updating marker for ${participant.name} at [${lat}, ${lng}]`);
            
            if (markers[participant.id]) {
                // Update existing marker
                markers[participant.id].setLatLng([lat, lng]);
                markers[participant.id].setPopupContent(`<b>${participant.name}</b><br>Last update: ${new Date(participant.last_update).toLocaleTimeString()}`);
            } else {
                // Create new marker with custom pin icon
                const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                const color = colors[participant.id % colors.length];
                
                // Build marker content with profile picture if available
                let markerContent = '';
                if (participant.profile_picture) {
                    markerContent = `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <img src="${participant.profile_picture}"
                                 style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid white;"
                                 onerror="this.style.display='none'">
                            <span>${participant.name}</span>
                        </div>
                    `;
                } else {
                    markerContent = participant.name;
                }
                
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
                            ">${markerContent}</div>
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
                    iconSize: [200, 80],
                    iconAnchor: [100, 80]
                });
                
                markers[participant.id] = L.marker([lat, lng], { icon })
                    .addTo(map)
                    .bindPopup(`<b>${participant.name}</b><br>Last update: ${new Date(participant.last_update).toLocaleTimeString()}`);
            }
        } else if (markers[participant.id]) {
            // Remove marker if participant went offline
            map.removeLayer(markers[participant.id]);
            delete markers[participant.id];
        }
    });
}

// Center map on a specific participant
function centerMapOnParticipant(participantId) {
    const marker = markers[participantId];
    if (marker) {
        const latLng = marker.getLatLng();
        map.setView(latLng, 16);
        marker.openPopup();
        showMessage('Map centered on participant', 'success');
    } else {
        showMessage('Participant location not available', 'error');
    }
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

// Fullscreen button
document.getElementById('fullscreenBtn').addEventListener('click', () => {
    const mapContainer = document.getElementById('mapContainer');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    if (mapContainer.classList.contains('fullscreen')) {
        // Exit fullscreen
        mapContainer.classList.remove('fullscreen');
        fullscreenBtn.textContent = '⛶ Fullscreen';
    } else {
        // Enter fullscreen
        mapContainer.classList.add('fullscreen');
        fullscreenBtn.textContent = '⛶ Exit Fullscreen';
    }
    
    // Invalidate map size to ensure proper rendering after resize
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
});

// Copy session code
document.getElementById('copyCodeBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(sessionCode);
    showMessage('Session code copied to clipboard!', 'success');
});

// Edit session name
document.getElementById('editSessionNameBtn').addEventListener('click', async () => {
    const newName = prompt('Enter new session name:', window.currentSessionName);
    
    if (!newName || newName === window.currentSessionName) {
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
            window.currentSessionName = newName;
            // Reload session info to update display
            loadSessionInfo();
        } else {
            showMessage(data.message || 'Failed to update session name', 'error');
        }
    } catch (error) {
        showMessage('Failed to update session name', 'error');
        console.error('Update session name error:', error);
    }
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
loadSessionInfo().then(() => {
    // Auto-start location sharing after session info is loaded
    if (participantId) {
        setTimeout(() => {
            startSharing();
        }, 1000); // Small delay to ensure map is ready
    }
});

// Start polling for participants updates
updateInterval = setInterval(loadParticipants, 3000); // Update every 3 seconds

// Initial load
loadParticipants();

// Alert button functionality
document.getElementById('alertBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/send_alert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Alert sent to all participants!', 'success');
        } else {
            showMessage(data.message || 'Failed to send alert', 'error');
        }
    } catch (error) {
        console.error('Send alert error:', error);
        showMessage('Failed to send alert', 'error');
    }
});

// Poll for notifications
let notificationInterval = null;
let alertBlinkTimeout = null;
let notificationPermissionGranted = false;
let isPageVisible = true;
let missedNotificationsCount = 0;

// Show notification permission banner
function showNotificationPermissionBanner() {
    const banner = document.getElementById('notificationPermissionBanner');
    if (banner && 'Notification' in window && Notification.permission === 'default') {
        banner.style.display = 'block';
    }
}

// Request notification permission on page load
async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        try {
            const permission = await Notification.requestPermission();
            notificationPermissionGranted = (permission === 'granted');
            if (notificationPermissionGranted) {
                console.log('Browser notifications enabled');
                // Hide banner if shown
                const banner = document.getElementById('notificationPermissionBanner');
                if (banner) banner.style.display = 'none';
            }
        } catch (error) {
            console.log('Notification permission request failed:', error);
        }
    } else if ('Notification' in window && Notification.permission === 'granted') {
        notificationPermissionGranted = true;
    }
}

// Handle notification permission banner buttons
document.addEventListener('DOMContentLoaded', () => {
    const enableBtn = document.getElementById('enableNotificationsBtn');
    const dismissBtn = document.getElementById('dismissNotificationBanner');
    
    if (enableBtn) {
        enableBtn.addEventListener('click', async () => {
            await requestNotificationPermission();
        });
    }
    
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            const banner = document.getElementById('notificationPermissionBanner');
            if (banner) banner.style.display = 'none';
        });
    }
    
    // Show banner after 3 seconds if permission not granted
    setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            showNotificationPermissionBanner();
        }
    }, 3000);
});

// Show browser notification (works even when tab is in background on mobile)
function showBrowserNotification(title, body, icon) {
    if (notificationPermissionGranted && 'Notification' in window) {
        try {
            const notification = new Notification(title, {
                body: body,
                icon: icon || 'img/hunt-hunt-planur-48p.webp',
                badge: 'img/hunt-hunt-planur-48p.webp',
                tag: 'hunt-hunt-planur-alert', // Replaces previous notification
                requireInteraction: true, // Keeps notification visible until user interacts
                vibrate: [200, 100, 200], // Vibration pattern for mobile
                silent: false
            });
            
            // Focus window when notification is clicked
            notification.onclick = function() {
                window.focus();
                notification.close();
            };
            
            return notification;
        } catch (error) {
            console.error('Failed to show browser notification:', error);
        }
    }
    return null;
}

// Play alert sound for mobile devices
function playAlertSound() {
    try {
        // Create a simple beep using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Frequency in Hz
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Could not play alert sound:', error);
    }
}

// Vibrate device (mobile only)
function vibrateDevice() {
    if ('vibrate' in navigator) {
        try {
            navigator.vibrate([200, 100, 200, 100, 200]); // Vibration pattern
        } catch (error) {
            console.log('Vibration failed:', error);
        }
    }
}

// Function to show blinking alert notification
function showBlinkingAlert(senderName) {
    const alertPanel = document.getElementById('alertNotificationPanel');
    const alertText = document.getElementById('alertNotificationText');
    
    // Set the alert text
    alertText.textContent = `Alert: ${senderName} is calling for your attention!`;
    
    // Show the panel with blinking animation
    alertPanel.style.display = 'block';
    alertPanel.classList.add('blinking');
    
    // Clear any existing timeout
    if (alertBlinkTimeout) {
        clearTimeout(alertBlinkTimeout);
    }
    
    // Stop blinking after 1 minute (60000 milliseconds)
    alertBlinkTimeout = setTimeout(() => {
        alertPanel.classList.remove('blinking');
        alertPanel.style.display = 'none';
    }, 60000);
}

async function checkNotifications() {
    try {
        const response = await fetch('/api/get_notifications');
        const data = await response.json();
        
        if (data.success && data.notifications.length > 0) {
            // Process each notification
            data.notifications.forEach(notification => {
                // Show blinking alert panel with sender name
                showBlinkingAlert(notification.sender_name);
                
                // Show notification message
                showMessage(notification.message, 'info');
                
                // If page is not visible (background/locked), use browser notification
                if (!isPageVisible || document.hidden) {
                    showBrowserNotification(
                        `Alert from ${notification.sender_name}`,
                        notification.message,
                        'img/hunt-hunt-planur-48p.webp'
                    );
                    missedNotificationsCount++;
                }
                
                // Play sound and vibrate for mobile devices
                playAlertSound();
                vibrateDevice();
                
                // Focus map on sender's location if available and page is visible
                if (isPageVisible && !document.hidden && notification.sender_latitude && notification.sender_longitude) {
                    map.setView([notification.sender_latitude, notification.sender_longitude], 16);
                    
                    // Find and open the sender's marker popup if they're online
                    const senderMarker = Object.values(markers).find(marker => {
                        const latLng = marker.getLatLng();
                        return Math.abs(latLng.lat - notification.sender_latitude) < 0.0001 &&
                               Math.abs(latLng.lng - notification.sender_longitude) < 0.0001;
                    });
                    
                    if (senderMarker) {
                        senderMarker.openPopup();
                    }
                }
            });
            
            // Mark notifications as read
            const notificationIds = data.notifications.map(n => n.id);
            await fetch('/api/mark_notifications_read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notification_ids: notificationIds })
            });
        }
    } catch (error) {
        console.error('Check notifications error:', error);
    }
}

// Handle page visibility changes (when user switches tabs or locks screen)
document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    
    if (isPageVisible) {
        console.log('Page became visible, resuming normal polling');
        // When page becomes visible again, check for notifications immediately
        checkNotifications();
        
        // Show message if there were missed notifications
        if (missedNotificationsCount > 0) {
            showMessage(`You have ${missedNotificationsCount} notification(s) while away`, 'info');
            missedNotificationsCount = 0;
        }
    } else {
        console.log('Page hidden, notifications will use browser notifications');
    }
});

// Request notification permission
requestNotificationPermission();

// Start polling for notifications every 2 seconds
notificationInterval = setInterval(checkNotifications, 2000);

// Initial check
checkNotifications();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopSharing();
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
    if (alertBlinkTimeout) {
        clearTimeout(alertBlinkTimeout);
    }
});
