(() => {
  const STORAGE_KEY = 'cdd_cookie_consent';
  const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const banner = document.querySelector('#cookie-consent');
  const checkout = document.querySelector('#payhip-checkout');
  let payhipLoaded = false;

  function getConsent() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !['accepted', 'rejected'].includes(saved.choice)) return null;
      if (Date.now() - saved.savedAt > CONSENT_MAX_AGE) return null;
      return saved.choice;
    } catch {
      return null;
    }
  }

  function saveConsent(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, savedAt: Date.now() }));
    } catch {
      // Consent still applies for this page view if storage is unavailable.
    }
  }

  function loadPayhip() {
    if (payhipLoaded) return;
    payhipLoaded = true;
    checkout.innerHTML = '<div class="payhip-embed-page" data-key="d3IO5">Loading secure checkout…</div>';

    const script = document.createElement('script');
    script.src = 'https://payhip.com/embed-page.js?v=24u68985';
    script.async = true;
    script.onerror = () => {
      checkout.innerHTML = '<p class="text-sm text-white">The checkout could not load. <a class="font-bold underline" href="https://payhip.com/b/d3IO5">Continue to Payhip</a>.</p>';
    };
    document.body.append(script);
  }

  function showBanner() {
    banner.hidden = false;
    banner.querySelector('[data-consent="reject"]').focus();
  }

  function hideBanner() {
    banner.hidden = true;
  }

  function applyConsent(choice) {
    saveConsent(choice);
    if (choice === 'rejected' && payhipLoaded) {
      window.location.reload();
      return;
    }
    hideBanner();
    if (choice === 'accepted') loadPayhip();
  }

  banner.addEventListener('click', (event) => {
    const button = event.target.closest('[data-consent]');
    if (button) applyConsent(button.dataset.consent === 'accept' ? 'accepted' : 'rejected');
  });

  document.querySelectorAll('[data-enable-payhip]').forEach((button) => {
    button.addEventListener('click', () => applyConsent('accepted'));
  });

  document.querySelectorAll('[data-cookie-settings]').forEach((button) => {
    button.addEventListener('click', showBanner);
  });

  const consent = getConsent();
  if (consent === 'accepted') loadPayhip();
  if (!consent) showBanner();
})();
