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

        // Hide all login/register links (be specific to avoid hiding unintended links)
        $('a[href="login.html"], a[href="./login.html"], a[href="#signin-modal"]').each(function() {
            const $link = $(this);
            const linkText = $link.text().toLowerCase();
            // Only hide if it's clearly a login/register link
            if (linkText.includes('login') || 
                linkText.includes('register') ||
                linkText.includes('sign in') ||
                $link.attr('href') === 'login.html' ||
                $link.attr('href') === './login.html' ||
                $link.attr('href') === '#signin-modal') {
                $link.closest('li').hide();
            }
        });

        // Update top menu login link (if exists)
        const topMenuLoginLink = document.getElementById('loginLink');
        if (topMenuLoginLink) {
            const $parent = $(topMenuLoginLink).parent('li');
            $parent.hide();
            
            // Check if user menu already exists
            if (!$parent.siblings('li.user-menu').length) {
                const userMenuHtml = `
                    <li class="user-menu">
                        <ul>
                            <li><a href="dashboard.html"><i class="icon-user"></i>${userName}</a></li>
                            ${userRole && userRole.toLowerCase() === 'admin' ? '<li><a href="admin-dashboard.html"><i class="icon-cog"></i>Admin Dashboard</a></li>' : ''}
                            <li><a href="#" id="nav-logout-link"><i class="icon-sign-out"></i>Logout</a></li>
                        </ul>
                    </li>
                `;
                $parent.parent('ul').append(userMenuHtml);
            }

            // Bind logout event (using event delegation)
            $(document).off('click', '#nav-logout-link').on('click', '#nav-logout-link', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Update top menu - replace login link with user menu
        $('.top-menu li').each(function() {
            const $li = $(this);
            const $loginLink = $li.find('a[href="login.html"], a[href="./login.html"], a[href="#signin-modal"]');
            if ($loginLink.length && !$li.hasClass('user-menu')) {
                const parentText = $li.find('> a').text().toLowerCase();
                // If this is the "Links" dropdown, just hide the login item inside it
                if (parentText.includes('links') || $li.find('ul').length > 0) {
                    $loginLink.closest('li').hide();
                } else {
                    // Replace standalone login link with user menu
                    const userMenuHtml = `
                        <ul>
                            <li><a href="dashboard.html"><i class="icon-user"></i>${userName}</a></li>
                            ${userRole && userRole.toLowerCase() === 'admin' ? '<li><a href="admin-dashboard.html"><i class="icon-cog"></i>Admin Dashboard</a></li>' : ''}
                            <li><a href="#" id="nav-logout-link"><i class="icon-sign-out"></i>Logout</a></li>
                        </ul>
                    `;
                    $li.html(userMenuHtml);
                }
            }
        });

        // Update main navigation Pages menu if exists
        const $pagesMenu = $('.main-nav a[href="login.html"]');
        if ($pagesMenu.length) {
            $pagesMenu.text('My Account').attr('href', 'dashboard.html');
        }

        // Hide login links in footer (be specific)
        $('footer a[href="login.html"], footer a[href="./login.html"]').closest('li').hide();
    },

    /**
     * Render navigation for unauthenticated users
     */
    renderUnauthenticatedNav: function () {
        // Show all login/register links
        $('a[href="login.html"], a[href="./login.html"], a[href="#signin-modal"]').closest('li').show();
        
        // Remove user menu if exists
        $('.user-menu').remove();
        
        // Show login link in top menu
        const $topMenu = $('.top-menu');
        if ($topMenu.length) {
            const $topLevelLi = $topMenu.children('li').first();
            
            // Check if login link exists, if not add it
            if ($topLevelLi.find('a[href="login.html"]').length === 0) {
                const $loginItem = $topLevelLi.find('ul li').last();
                if ($loginItem.length && !$loginItem.find('a[href="login.html"]').length) {
                    $loginItem.after('<li><a href="login.html" id="loginLink"><i class="icon-user"></i>Login / Register</a></li>');
                } else if ($topLevelLi.find('ul').length) {
                    $topLevelLi.find('ul').append('<li><a href="login.html" id="loginLink"><i class="icon-user"></i>Login / Register</a></li>');
                }
            }
        }

        // Update main navigation
        const $pagesMenu = $('.main-nav a[href="dashboard.html"]');
        if ($pagesMenu.length) {
            $pagesMenu.text('Login').attr('href', 'login.html');
        }

        // Show login links in footer
        $('footer a[href="login.html"], footer a[href="./login.html"]').closest('li').show();
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
