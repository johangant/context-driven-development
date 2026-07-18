(() => {
  const STORAGE_KEY = 'cdd_cookie_consent';
  const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const PAYHIP_PRODUCT_KEY = 'd3IO5';
  const PAYHIP_PRODUCT_URL = 'https://payhip.com/b/d3IO5';
  const PAYHIP_SCRIPT_ID = 'payhip-embed-script';
  const PAYHIP_SCRIPT_URL = 'https://payhip.com/embed-page.js?v=24u68985';
  const PAYHIP_LOAD_TIMEOUT = 12000;
  const banner = document.querySelector('#cookie-consent');
  const checkout = document.querySelector('#payhip-checkout');
  let payhipLoaded = false;
  let payhipLoading = false;
  let payhipLoadTimer;

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

  function checkoutHasIframe() {
    return Boolean(checkout.querySelector('iframe'));
  }

  function markPayhipLoaded() {
    if (!checkoutHasIframe()) return false;
    window.clearTimeout(payhipLoadTimer);
    payhipLoaded = true;
    payhipLoading = false;
    checkout.dataset.state = 'loaded';
    return true;
  }

  function showPayhipError() {
    if (markPayhipLoaded()) return;
    window.clearTimeout(payhipLoadTimer);
    payhipLoaded = false;
    payhipLoading = false;
    checkout.dataset.state = 'error';
    checkout.innerHTML = [
      '<p class="max-w-sm text-sm leading-6 text-white">',
      'The embedded checkout could not load. ',
      '<a class="font-bold underline" href="' + PAYHIP_PRODUCT_URL + '">Continue to Payhip</a>.',
      '</p>',
      '<button type="button" data-enable-payhip class="mt-4 rounded-full bg-lime px-6 py-3 font-bold text-ink transition hover:-translate-y-0.5 hover:shadow-lg">',
      'Try the embedded checkout again',
      '</button>'
    ].join('');
  }

  function initialisePayhip() {
    if (markPayhipLoaded()) return;
    if (!window.PayhipEmbedPage || typeof window.PayhipEmbedPage.init !== 'function') {
      showPayhipError();
      return;
    }

    const originalUrl = window.location.href;
    const originalHistoryState = window.history.state;
    const urlWithoutHash = new URL(originalUrl);
    urlWithoutHash.hash = '';

    try {
      // Payhip appends its own query parameters to window.location.href
      // without encoding a hash. Temporarily remove the hash so iframe_id
      // reaches Payhip, then restore the visible URL without navigating.
      if (urlWithoutHash.href !== originalUrl) {
        window.history.replaceState(originalHistoryState, '', urlWithoutHash.href);
      }
      window.PayhipEmbedPage.init();
      if (!markPayhipLoaded()) showPayhipError();
    } catch {
      showPayhipError();
    } finally {
      if (window.location.href !== originalUrl) {
        window.history.replaceState(originalHistoryState, '', originalUrl);
      }
    }
  }

  function waitForPayhipApi() {
    const startedAt = Date.now();

    function check() {
      if (window.PayhipEmbedPage && typeof window.PayhipEmbedPage.init === 'function') {
        initialisePayhip();
        return;
      }
      if (Date.now() - startedAt >= PAYHIP_LOAD_TIMEOUT) {
        showPayhipError();
        return;
      }
      window.setTimeout(check, 50);
    }

    check();
  }

  function loadPayhip() {
    if (markPayhipLoaded() || payhipLoading) return;
    payhipLoading = true;
    checkout.dataset.state = 'loading';
    checkout.innerHTML = '<div class="payhip-embed-page" data-key="' + PAYHIP_PRODUCT_KEY + '">Loading secure checkout…</div>';

    // Loading Payhip before the window load event lets its own handler race
    // with consent. Waiting also ensures we control one explicit init call.
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        payhipLoading = false;
        loadPayhip();
      }, { once: true });
      return;
    }

    window.clearTimeout(payhipLoadTimer);
    payhipLoadTimer = window.setTimeout(showPayhipError, PAYHIP_LOAD_TIMEOUT);

    if (window.PayhipEmbedPage && typeof window.PayhipEmbedPage.init === 'function') {
      initialisePayhip();
      return;
    }

    const existingScript = document.querySelector('#' + PAYHIP_SCRIPT_ID);
    if (existingScript) {
      waitForPayhipApi();
      return;
    }

    const script = document.createElement('script');
    script.id = PAYHIP_SCRIPT_ID;
    script.src = PAYHIP_SCRIPT_URL;
    script.async = true;
    script.addEventListener('load', waitForPayhipApi, { once: true });
    script.addEventListener('error', showPayhipError, { once: true });
    document.head.append(script);
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
    if (choice === 'rejected' && (payhipLoaded || payhipLoading)) {
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

  checkout.addEventListener('click', (event) => {
    const button = event.target.closest('[data-enable-payhip]');
    if (!button) return;

    if (checkout.dataset.state === 'error' && !window.PayhipEmbedPage) {
      document.querySelectorAll('script[src*="payhip.com"]').forEach((script) => script.remove());
    }
    applyConsent('accepted');
  });

  document.querySelectorAll('[data-cookie-settings]').forEach((button) => {
    button.addEventListener('click', showBanner);
  });

  const consent = getConsent();
  if (consent === 'accepted') loadPayhip();
  if (!consent) showBanner();
})();
