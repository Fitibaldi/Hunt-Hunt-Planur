// Profile JavaScript

let currentUser = null;

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

// Load user profile
async function loadProfile() {
    try {
        const response = await fetch('/api/get_profile');
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            
            // Fill form fields
            document.getElementById('username').value = data.user.username;
            document.getElementById('email').value = data.user.email;
            document.getElementById('authProvider').value = 
                data.user.auth_provider === 'google' ? 'Google Account' : 'Local Account';
            
            // Set profile picture or initials
            if (data.user.profile_picture) {
                document.getElementById('profilePicturePreview').src = data.user.profile_picture;
                document.getElementById('profilePicturePreview').style.display = 'block';
                document.getElementById('profilePicturePlaceholder').style.display = 'none';
                document.getElementById('removePictureBtn').style.display = 'inline-block';
            } else {
                // Show initials
                const initials = data.user.username.substring(0, 2).toUpperCase();
                document.getElementById('profileInitials').textContent = initials;
                document.getElementById('profilePicturePreview').style.display = 'none';
                document.getElementById('profilePicturePlaceholder').style.display = 'flex';
                document.getElementById('removePictureBtn').style.display = 'none';
            }
        } else {
            showMessage('Failed to load profile', 'error');
        }
    } catch (error) {
        console.error('Load profile error:', error);
        showMessage('Failed to load profile', 'error');
    }
}

// Update profile
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    
    try {
        const response = await fetch('/api/update_profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Profile updated successfully!', 'success');
            document.getElementById('userDisplay').textContent = `Welcome, ${username}`;
        } else {
            showMessage(data.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Update profile error:', error);
        showMessage('Failed to update profile', 'error');
    }
});

// Upload picture button
document.getElementById('uploadPictureBtn').addEventListener('click', () => {
    document.getElementById('profilePictureInput').click();
});

// Handle file selection
document.getElementById('profilePictureInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showMessage('Please select an image file', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('Image size must be less than 5MB', 'error');
        return;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    try {
        const response = await fetch('/api/upload_profile_picture', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Profile picture updated successfully!', 'success');
            // Update preview
            document.getElementById('profilePicturePreview').src = data.profile_picture_url;
            document.getElementById('profilePicturePreview').style.display = 'block';
            document.getElementById('profilePicturePlaceholder').style.display = 'none';
            document.getElementById('removePictureBtn').style.display = 'inline-block';
        } else {
            showMessage(data.message || 'Failed to upload picture', 'error');
        }
    } catch (error) {
        console.error('Upload picture error:', error);
        showMessage('Failed to upload picture', 'error');
    }
});

// Remove picture button
document.getElementById('removePictureBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/remove_profile_picture', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Profile picture removed successfully!', 'success');
            // Show initials
            const initials = currentUser.username.substring(0, 2).toUpperCase();
            document.getElementById('profileInitials').textContent = initials;
            document.getElementById('profilePicturePreview').style.display = 'none';
            document.getElementById('profilePicturePlaceholder').style.display = 'flex';
            document.getElementById('removePictureBtn').style.display = 'none';
        } else {
            showMessage(data.message || 'Failed to remove picture', 'error');
        }
    } catch (error) {
        console.error('Remove picture error:', error);
        showMessage('Failed to remove picture', 'error');
    }
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
        loadProfile();
    }
});
