// History JavaScript

let allSessions = [];
let currentFilter = 'all';

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

// Load all sessions history
async function loadHistory() {
    try {
        const response = await fetch('/api/get_all_sessions_history');
        const data = await response.json();
        
        if (data.success) {
            allSessions = data.sessions;
            displaySessions(allSessions);
        } else {
            showMessage('Failed to load session history', 'error');
        }
    } catch (error) {
        console.error('Load history error:', error);
        showMessage('Failed to load session history', 'error');
    }
}

// Display sessions based on current filter
function displaySessions(sessions) {
    const historyList = document.getElementById('historyList');
    
    if (sessions.length === 0) {
        historyList.innerHTML = '<p class="loading">No sessions found.</p>';
        return;
    }
    
    historyList.innerHTML = sessions.map(session => {
        const isActive = session.is_active;
        const isCreator = session.is_creator;
        const statusBadge = isActive 
            ? '<span style="color: #10b981; font-weight: bold;">● Active</span>'
            : '<span style="color: #64748b; font-weight: bold;">○ Ended</span>';
        
        const roleBadge = isCreator
            ? '<span style="background: #2563eb; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">Creator</span>'
            : '<span style="background: #8b5cf6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">Participant</span>';
        
        const creatorInfo = !isCreator ? `<p class="session-meta">Created by: ${session.creator_name}</p>` : '';
        
        const actionButton = isActive
            ? `<a href="session.html?code=${session.session_code}" class="btn btn-primary btn-small">
                ${session.user_is_active ? 'Open' : 'Rejoin'}
               </a>`
            : '';
        
        const endButton = isActive && isCreator
            ? `<button onclick="endSession('${session.session_code}')" class="btn btn-danger btn-small">End</button>`
            : '';
        
        // Show max participants and active participants if session is active
        const participantInfo = isActive && session.active_participant_count !== undefined
            ? `<p class="session-meta">Participants: ${session.participant_count || 0} total (${session.active_participant_count} active)</p>`
            : `<p class="session-meta">Participants: ${session.participant_count || 0} total</p>`;
        
        return `
            <div class="session-item">
                <div class="session-details">
                    <h4>${session.session_name} ${statusBadge} ${roleBadge}</h4>
                    <p class="session-code">Code: ${session.session_code}</p>
                    ${creatorInfo}
                    <p class="session-meta">Created: ${new Date(session.created_at).toLocaleString()}</p>
                    ${participantInfo}
                    ${session.joined_at ? `<p class="session-meta">You joined: ${new Date(session.joined_at).toLocaleString()}</p>` : ''}
                </div>
                <div class="session-actions">
                    ${actionButton}
                    ${endButton}
                </div>
            </div>
        `;
    }).join('');
}

// Filter sessions
function filterSessions(filter) {
    currentFilter = filter;
    
    let filtered = allSessions;
    
    switch(filter) {
        case 'created':
            filtered = allSessions.filter(s => s.is_creator);
            break;
        case 'joined':
            filtered = allSessions.filter(s => !s.is_creator);
            break;
        case 'active':
            filtered = allSessions.filter(s => s.is_active);
            break;
        case 'ended':
            filtered = allSessions.filter(s => !s.is_active);
            break;
        case 'all':
        default:
            filtered = allSessions;
    }
    
    displaySessions(filtered);
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
            loadHistory(); // Reload history
        } else {
            showMessage(data.message || 'Failed to end session', 'error');
        }
    } catch (error) {
        showMessage('An error occurred. Please try again.', 'error');
        console.error('End session error:', error);
    }
}

// Filter tabs event listeners
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Filter sessions
        const filter = tab.getAttribute('data-filter');
        filterSessions(filter);
    });
});

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
        loadHistory();
    }
});
