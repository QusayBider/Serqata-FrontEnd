/**
 * login-auth.js
 * UI wiring for the glassmorphism login/register/forgot-password page.
 * Delegates all API calls & token storage to auth.js (which must load first).
 *
 * Load order in login.html:
 *   1. assets/js/config.js
 *   2. assets/js/auth.js        ← contains login(), register(), forgetPassword(), storeToken() …
 *   3. login-auth.js            ← this file
 */

(function () {
  "use strict";

  /* ─────────────────────────────────────────────
   * Panel navigation
   * ───────────────────────────────────────────── */
  function showPanel(id) {
    document.querySelectorAll(".panel").forEach((p) => {
      p.classList.remove("active");
      p.style.display = "none";
    });
    const target = document.getElementById(id);
    if (!target) return;
    target.style.display = "block";
    void target.offsetWidth; // force reflow → re-trigger CSS animation
    target.classList.add("active");
  }

  /* ─────────────────────────────────────────────
   * UI helpers (override the auth.js versions so
   * they work with the new glassmorphism markup)
   * ───────────────────────────────────────────── */
  function uiShowMessage(elementId, text, isError = false) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.className = "message-box" + (isError ? " error" : "");

    const icon = isError
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>`;

    el.innerHTML = icon + `<span>${text}</span>`;
    el.style.display = "flex";

    // Auto-hide after 5 s (same as auth.js)
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => { el.style.display = "none"; }, 5000);
  }

  function uiHideMessage(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.style.display = "none";
  }

  /* Map the element IDs auth.js uses → the IDs in the new HTML.
     auth.js calls showMessage('login-message', …) and showMessage('register-message', …).*/
  const ID_MAP = {
    "login-error":            "login-message",
    "register-error":         "register-message",
    "login-modal-message":    "login-message",
    "register-modal-message": "register-message",
    "forget-password-message":"forgot-message",
    "forget-password-error":  "forgot-error",
  };

  function resolveId(id) { return ID_MAP[id] || id; }

  // Patch the global helpers that auth.js already defined so they
  // route through our glassmorphism message boxes.
  window.showMessage = function (elementId, message, isError = false) {
    uiShowMessage(resolveId(elementId), message, isError);
  };
  window.hideMessage = function (elementId) {
    uiHideMessage(resolveId(elementId));
  };

  /* ─────────────────────────────────────────────
   * Loading-state helpers
   * ───────────────────────────────────────────── */
  function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    const text   = btn.querySelector(".btn-text");
    const loader = btn.querySelector(".btn-loader");
    if (text)   text.style.display   = loading ? "none"   : "inline";
    if (loader) loader.style.display = loading ? "inline" : "none";
  }

  /* ─────────────────────────────────────────────
   * Password visibility (press-and-hold)
   * ───────────────────────────────────────────── */
  function initPasswordToggle() {
    const btn   = document.getElementById("toggle-password");
    const field = document.getElementById("singin-password-2");
    const icon  = document.getElementById("eye-icon");
    if (!btn || !field) return;

    const SVG_OPEN  = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    const SVG_SLASH = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;

    const show = () => { field.type = "text";     if (icon) icon.innerHTML = SVG_SLASH; };
    const hide = () => { field.type = "password"; if (icon) icon.innerHTML = SVG_OPEN;  };

    btn.addEventListener("mousedown", show);
    document.addEventListener("mouseup", hide);
    btn.addEventListener("touchstart",  (e) => { e.preventDefault(); show(); });
    btn.addEventListener("touchend",    (e) => { e.preventDefault(); hide(); });
    btn.addEventListener("touchcancel", (e) => { e.preventDefault(); hide(); });
  }

  /* ─────────────────────────────────────────────
   * Form submit handlers (delegate to auth.js)
   * ───────────────────────────────────────────── */
  function handleLogin(e) {
    e.preventDefault();
    uiHideMessage("login-message");

    const email    = document.getElementById("singin-email-2").value.trim();
    const password = document.getElementById("singin-password-2").value;
    const remember = document.getElementById("signin-remember-2").checked;

    if (!email || !password) {
      uiShowMessage("login-message", "Please fill in all fields.", true);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      uiShowMessage("login-message", "Please enter a valid email address.", true);
      return;
    }

    // Save/clear remembered email using auth.js cookie helpers
    if (remember) {
      setCookie("rememberedEmail", email, 7 * 24 * 60);
    } else {
      deleteCookie("rememberedEmail");
    }

    setLoading("login-btn", true);

    // auth.js login() calls showMessage() internally and handles redirect
    login(email, password).finally(() => setLoading("login-btn", false));
  }

  function handleRegister(e) {
    e.preventDefault();
    uiHideMessage("register-message");
    uiHideMessage("register-error");

    const fullName    = document.getElementById("register-fullname-2").value.trim();
    const userName    = document.getElementById("register-username-2").value.trim();
    const email       = document.getElementById("register-email-2").value.trim();
    const phoneNumber = document.getElementById("register-phone-2").value.trim();
    const password    = document.getElementById("register-password-2").value;
    const policy      = document.getElementById("register-policy-2").checked;

    // Validation checks
    if (!fullName || !userName || !email || !phoneNumber || !password) {
      uiShowMessage("register-error", "Please fill in all fields.", true);
      return;
    }

    if (fullName.length < 2) {
      uiShowMessage("register-error", "Full name must be at least 2 characters.", true);
      return;
    }

    if (userName.length < 3) {
      uiShowMessage("register-error", "Username must be at least 3 characters.", true);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      uiShowMessage("register-error", "Please enter a valid email address.", true);
      return;
    }

    // Phone validation (basic - just check it's digits and dashes)
    const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      uiShowMessage("register-error", "Please enter a valid phone number.", true);
      return;
    }

    // Password validation
    if (password.length < 6) {
      uiShowMessage("register-error", "Password must be at least 6 characters.", true);
      return;
    }

    if (!policy) {
      uiShowMessage("register-error", "You must agree to the privacy policy.", true);
      return;
    }

    setLoading("register-btn", true);

    // auth.js register() calls showMessage() internally and handles redirect
    register(email, password, userName, fullName, phoneNumber)
      .finally(() => setLoading("register-btn", false));
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    uiHideMessage("forgot-message");
    uiHideMessage("forgot-error");

    const email = document.getElementById("forget-password-email").value.trim();
    if (!email) {
      uiShowMessage("forgot-error", "Please enter your email address.", true);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      uiShowMessage("forgot-error", "Please enter a valid email address.", true);
      return;
    }

    // auth.js forgetPassword() calls showMessage() internally
    forgetPassword(email);
  }

  /* ─────────────────────────────────────────────
   * Init
   * ───────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", function () {

    // Default panel
    showPanel("panel-login");

    // Pre-fill remembered email (getCookie is defined in auth.js)
    const remembered = getCookie("rememberedEmail");
    if (remembered) {
      const f = document.getElementById("singin-email-2");
      if (f) f.value = remembered;
      const c = document.getElementById("signin-remember-2");
      if (c) c.checked = true;
    }

    initPasswordToggle();

    // Forms
    document.getElementById("login-form")
      ?.addEventListener("submit", handleLogin);

    document.getElementById("register-form")
      ?.addEventListener("submit", handleRegister);

    document.getElementById("forgot-form")
      ?.addEventListener("submit", handleForgotPassword);

    // Panel links
    document.getElementById("go-register")
      ?.addEventListener("click", (e) => { e.preventDefault(); showPanel("panel-register"); });

    document.getElementById("go-login")
      ?.addEventListener("click", (e) => { e.preventDefault(); showPanel("panel-login"); });

    document.getElementById("open-forgot")
      ?.addEventListener("click", (e) => { e.preventDefault(); showPanel("panel-forgot"); });

    document.getElementById("back-to-login")
      ?.addEventListener("click", (e) => { e.preventDefault(); showPanel("panel-login"); });
  });

})();
