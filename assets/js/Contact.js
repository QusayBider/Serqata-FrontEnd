(function () {
  const API_URL = API_CONFIG.getApiUrl(`Contact/Submit`);

  function showAlert(message, type = 'success') {
    // Remove any existing alert
    const existing = document.getElementById('contact-alert');
    if (existing) existing.remove();

    const alert = document.createElement('div');
    alert.id = 'contact-alert';
    alert.className = `alert alert-${type} alert-dismissible fade show mt-3 mb-3`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
      ${message}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>`;

    // Insert above the form
    const form = document.querySelector('.contact-submit-btn');
    if (form) form.parentNode.insertBefore(alert, form);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (alert && alert.parentNode) {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
      }
    }, 5000);
  }

  // ── Utility: set button loading state ────────────────────────────────────
  function setButtonLoading(btn, isLoading) {
    if (isLoading) {
      btn.disabled = true;
      btn.dataset.originalHtml = btn.innerHTML;
      btn.innerHTML = `<span>SENDING…</span> <i class="icon-refresh"></i>`;
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalHtml || `<span>SUBMIT</span><i class="icon-long-arrow-right"></i>`;
    }
  }

  // ── Main submit handler ───────────────────────────────────────────────────
  async function handleContactSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Collect field values
    const name    = (document.getElementById('cname')?.value    ?? '').trim();
    const email   = (document.getElementById('cemail')?.value   ?? '').trim();
    const phone   = (document.getElementById('cphone')?.value   ?? '').trim();
    const subject = (document.getElementById('csubject')?.value ?? '').trim();
    const message = (document.getElementById('cmessage')?.value ?? '').trim();

    // Basic client-side validation (HTML5 handles required, but just in case)
    if (!name || !email || !phone || !message) {
      showAlert('Please fill in all required fields (Name, Email, Phone, Message).', 'warning');
      return;
    }

    const payload = { name, email, subject, message, phone };

    setButtonLoading(submitBtn, true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showAlert('✔ Your message has been sent! We\'ll get back to you soon.', 'success');
        form.reset();
      } else {
        // Try to parse an error message from the API
        let errorMsg = `Request failed with status ${response.status}.`;
        try {
          const errorData = await response.json();
          if (errorData?.message) errorMsg = errorData.message;
          else if (errorData?.title) errorMsg = errorData.title;
        } catch (_) { /* ignore parse errors */ }
        showAlert(`✖ ${errorMsg}`, 'danger');
      }
    } catch (networkError) {
      console.error('Contact form network error:', networkError);
      showAlert(
        '✖ Could not reach the server. Please check your connection and try again.',
        'danger'
      );
    } finally {
      setButtonLoading(submitBtn, false);
    }
  }

  // ── Bootstrap: attach listener when DOM is ready ─────────────────────────
  function init() {
    const form = document.querySelector('.contact-form');
    if (!form) {
      console.warn('contact-form.js: No element with class "contact-form" found.');
      return;
    }
    form.addEventListener('submit', handleContactSubmit);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
