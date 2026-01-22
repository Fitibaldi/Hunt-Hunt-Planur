// Join Session JavaScript

let isLoggedIn = false;

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

// Check if user is logged in
async function checkAuth() {
    try {
        const response = await fetch('/api/check_auth');
        const data = await response.json();
        
        if (data.authenticated) {
            isLoggedIn = true;
            // Show user info
            document.getElementById('userInfo').style.display = 'block';
            document.getElementById('username').textContent = data.username;
            // Hide guest name field
            document.getElementById('guestNameGroup').style.display = 'none';
            document.getElementById('guest_name').removeAttribute('required');
            // Update subtitle
            document.getElementById('subtitle').textContent = 'Enter session code to join as ' + data.username;
        } else {
            isLoggedIn = false;
            // Show guest name field
            document.getElementById('userInfo').style.display = 'none';
            document.getElementById('guestNameGroup').style.display = 'block';
            document.getElementById('guest_name').setAttribute('required', 'required');
            // Update subtitle
            document.getElementById('subtitle').textContent = 'Enter session code to join as a guest';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        isLoggedIn = false;
    }
}

// Join Form Handler
const joinForm = document.getElementById('joinForm');
if (joinForm) {
    joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const sessionCode = document.getElementById('session_code').value.toUpperCase();
        const requestBody = { session_code: sessionCode };
        
        // Only include guest_name if user is not logged in
        if (!isLoggedIn) {
            const guestName = document.getElementById('guest_name').value;
            if (!guestName) {
                showMessage('Please enter your name', 'error');
                return;
            }
            requestBody.guest_name = guestName;
        }
        
        try {
            const response = await fetch('/api/join_session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage('Joining session...', 'success');
                setTimeout(() => {
                    window.location.href = `session.html?code=${sessionCode}`;
                }, 1000);
            } else {
                showMessage(data.message || 'Failed to join session', 'error');
            }
        } catch (error) {
            showMessage('An error occurred. Please try again.', 'error');
            console.error('Join error:', error);
        }
    });
}

// Auto-uppercase session code
const sessionCodeInput = document.getElementById('session_code');
if (sessionCodeInput) {
    sessionCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
}

// Check authentication on page load
checkAuth();
