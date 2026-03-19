(function () {
  const API_URL = API_CONFIG.getApiUrl('SocialMedia/GetAllSocialMedia');

  const ICON_MAP = {
    facebook:  'icon-facebook-f',
    twitter:   'icon-twitter',
    pinterest: 'icon-pinterest',
    linkedin:  'icon-linkedin',
    instagram: 'icon-instagram',
    youtube:   'icon-youtube',
    whatsapp:  'icon-whatsapp',
  };

  const COLOR_MAP = {
    facebook:  'social-facebook',
    twitter:   'social-twitter',
    pinterest: 'social-pinterest',
    linkedin:  'social-linkedin',
    instagram: 'social-instagram',
    youtube:   'social-youtube',
    whatsapp:  'social-whatsapp',
  };

  function buildIcon(item) {
    const key = item.name.toLowerCase();
    const a = document.createElement('a');
    a.href      = item.links || '#';
    a.target    = '_blank';
    a.rel       = 'noopener noreferrer';
    a.title     = item.name;
    a.className = `social-icon ${COLOR_MAP[key] || ''}`;

    if (ICON_MAP[key]) {
      // ✅ Found in library — use icon font
      const i = document.createElement('i');
      i.className = ICON_MAP[key];
      a.appendChild(i);
    } else if (item.imageUrl) {
      const img = document.createElement('img');
      img.src    = item.imageUrl;
      img.alt    = item.name;
      img.width  = 30;
      img.height = 30;
      img.style.cssText = 'object-fit:contain;border-radius:3px;';
      a.appendChild(img);
    } else {
      // ✅ Nothing available — generic globe icon
      const i = document.createElement('i');
      i.className = 'icon-globe';
      a.appendChild(i);
    }

    return a;
  }

  async function loadSocialIcons() {
    const containers = document.querySelectorAll('.social-icons-colored');
    if (!containers.length) return;

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      if (!json.success || !Array.isArray(json.data)) return;

      const active = json.data.filter(item => item.status === 'Active');

      containers.forEach(container => {
        // Remove any previously injected icons (avoid duplicates on re-call)
        container.querySelectorAll('a.social-icon').forEach(el => el.remove());

        active.forEach(item => {
          container.appendChild(buildIcon(item));
        });
      });

    } catch (err) {
      console.error('social-media.js: Failed to load social media links', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSocialIcons);
  } else {
    loadSocialIcons();
  }
})();