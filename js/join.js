// Join Session JavaScript

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

// Join Form Handler
const joinForm = document.getElementById('joinForm');
if (joinForm) {
    joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const guestName = document.getElementById('guest_name').value;
        const sessionCode = document.getElementById('session_code').value.toUpperCase();
        
        try {
            const response = await fetch('/api/join_session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ guest_name: guestName, session_code: sessionCode })
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
