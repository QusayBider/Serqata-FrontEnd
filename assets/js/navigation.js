const NavigationManager = {

    init: function () {
        this.updateNavigation();

        // Re-check authentication periodically (every 30 seconds)
        setInterval(() => {
            this.updateNavigation();
        }, 30000);
    },

    /**
     * Update all navigation elements based on auth state
     */
    updateNavigation: function () {
        if (isAuthenticated()) {
            this.renderAuthenticatedNav();
        } else {
            this.renderUnauthenticatedNav();
        }
    },

    /**
     * Render navigation for authenticated users
     */
    renderAuthenticatedNav: function () {
        const userInfo = getUserInfo();
        const userName = userInfo.name || 'User';
        const userRole = userInfo.role;

        // Update top menu login link
        const topMenuLoginLink = document.getElementById('loginLink');
        topMenuLoginLink.style.display = 'none';
        if (topMenuLoginLink) {
            // Create dropdown menu
            const $parent = topMenuLoginLink.parentElement;
            if (!$parent.querySelector('ul')) {
                const dropdownHtml = `
                    <ul >
                        <li><a href="dashboard.html"><i class="icon-user"></i>${userName}</a></li>
                        ${userRole && userRole.toLowerCase() === 'admin' ? '<li><a href="admin-dashboard.html"><i class="icon-cog"></i>Dashboard</a></li>' : ''}
                        <li><a href="#" id="nav-logout-link"><i class="icon-sign-out"></i>Logout</a></li>
                    </ul>
                `;
                $parent.insertAdjacentHTML('beforeend', dropdownHtml);

                // Bind logout event
                $('#nav-logout-link').on('click', (e) => {
                    e.preventDefault();
                    this.handleLogout();
                });
            }
        }

        // Update main navigation Pages menu if exists
        const $pagesMenu = $('.main-nav a[href="login.html"]');
        if ($pagesMenu.length) {
            $pagesMenu.text('My Account').attr('href', 'dashboard.html');
        }
    },

    /**
     * Render navigation for unauthenticated users
     */
    renderUnauthenticatedNav: function () {
        const $topMenu = $('.top-menu');
        if ($topMenu.length) {
            const $topLevelLi = $topMenu.children('li').first();

            const guestHtml = `
                <a href="#">Links</a>
                <ul>
                    <li><a href="tel:#"><i class="icon-phone"></i>Call: +970 568 291 008</a></li>
                    <li><a href="contact.html">Contact Us</a></li>
                    <li><a href="login.html"><i class="icon-user"></i>Login / Register</a></li>
                </ul>
            `;

            if ($topLevelLi.find('a[href="login.html"]').length === 0 && !isAuthenticated()) {
                $topLevelLi.html(guestHtml);
                $topLevelLi.css({ 'text-align': '', 'display': '' });
            }
        }

        // Update main navigation
        const $pagesMenu = $('.main-nav a[href="dashboard.html"]');
        if ($pagesMenu.length) {
            $pagesMenu.text('Login').attr('href', 'login.html');
        }
    },

    handleLogout: function () {
        // Show confirmation
        Swal.fire({
            title: 'Logout',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#cc9966',
            cancelButtonColor: '#6e707e',
            confirmButtonText: 'Yes, logout!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                clearAuth();
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        });
    }
};

$(document).ready(function () {
    NavigationManager.init();
});
