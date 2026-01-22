// Navigation Menu Component

class NavigationMenu {
    constructor() {
        this.isAuthenticated = false;
        this.username = '';
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.createMenu();
        this.attachEventListeners();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/check_auth');
            const data = await response.json();
            this.isAuthenticated = data.authenticated;
            this.username = data.username || '';
        } catch (error) {
            console.error('Auth check error:', error);
            this.isAuthenticated = false;
        }
    }

    createMenu() {
        // Create burger menu HTML
        const menuHTML = `
            <div class="burger-menu-container">
                <button class="burger-button" id="burgerButton" aria-label="Menu">
                    <span class="burger-line"></span>
                    <span class="burger-line"></span>
                    <span class="burger-line"></span>
                </button>
                <nav class="burger-nav" id="burgerNav">
                    <div class="burger-nav-header">
                        <h3>🗺️ Menu</h3>
                        <button class="burger-close" id="burgerClose">&times;</button>
                    </div>
                    <ul class="burger-nav-list">
                        ${this.getMenuItems()}
                    </ul>
                </nav>
                <div class="burger-overlay" id="burgerOverlay"></div>
            </div>
        `;

        // Insert menu into the first header found
        const header = document.querySelector('header');
        if (header) {
            // Create a wrapper div for the burger menu
            const menuWrapper = document.createElement('div');
            menuWrapper.innerHTML = menuHTML;
            header.insertBefore(menuWrapper.firstElementChild, header.firstChild);
        }
    }

    getMenuItems() {
        const items = [];

        // Always show Home
        items.push('<li><a href="index.html">🏠 Home</a></li>');

        if (this.isAuthenticated) {
            // Logged in user menu items
            items.push(`<li class="menu-user-info">👤 ${this.username}</li>`);
            items.push('<li><a href="dashboard.html">📊 Dashboard</a></li>');
            items.push('<li><a href="history.html">📜 History</a></li>');
            items.push('<li><a href="join.html">🎯 Join Session</a></li>');
            items.push('<li><button id="navLogout" class="nav-logout-btn">🚪 Logout</button></li>');
        } else {
            // Guest user menu items
            items.push('<li><a href="login.html">🔐 Login</a></li>');
            items.push('<li><a href="register.html">📝 Register</a></li>');
            items.push('<li><a href="join.html">🎯 Join as Guest</a></li>');
        }

        return items.join('');
    }

    attachEventListeners() {
        const burgerButton = document.getElementById('burgerButton');
        const burgerClose = document.getElementById('burgerClose');
        const burgerOverlay = document.getElementById('burgerOverlay');
        const burgerNav = document.getElementById('burgerNav');

        if (burgerButton) {
            burgerButton.addEventListener('click', () => this.openMenu());
        }

        if (burgerClose) {
            burgerClose.addEventListener('click', () => this.closeMenu());
        }

        if (burgerOverlay) {
            burgerOverlay.addEventListener('click', () => this.closeMenu());
        }

        // Logout button (if authenticated)
        const logoutBtn = document.getElementById('navLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.logout();
            });
        }

        // Close menu when clicking on a link
        if (burgerNav) {
            const links = burgerNav.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });
        }
    }

    openMenu() {
        const burgerNav = document.getElementById('burgerNav');
        const burgerOverlay = document.getElementById('burgerOverlay');
        const burgerButton = document.getElementById('burgerButton');

        if (burgerNav) burgerNav.classList.add('active');
        if (burgerOverlay) burgerOverlay.classList.add('active');
        if (burgerButton) burgerButton.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeMenu() {
        const burgerNav = document.getElementById('burgerNav');
        const burgerOverlay = document.getElementById('burgerOverlay');
        const burgerButton = document.getElementById('burgerButton');

        if (burgerNav) burgerNav.classList.remove('active');
        if (burgerOverlay) burgerOverlay.classList.remove('active');
        if (burgerButton) burgerButton.classList.remove('active');
        document.body.style.overflow = '';
    }

    async logout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Failed to logout. Please try again.');
        }
    }
}

// Initialize navigation menu when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new NavigationMenu();
    });
} else {
    new NavigationMenu();
}
