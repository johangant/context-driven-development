# Context Driven Development

A static landing page for Context Driven Development, including a consent-gated Payhip checkout for digital products.

## Technology

- Static HTML and CSS
- Tailwind CSS via CDN
- Payhip embedded checkout
- Plain JavaScript cookie-consent handling
- GitHub Pages hosting

## Run locally

The Payhip embed requires the page to be served over HTTP rather than opened directly from the filesystem.

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deployment

Publish the repository through GitHub Pages using the repository root as the site source. The expected public URL is:

<https://johangant.github.io/context-driven-development/>

The site has no build step and does not require server-side environment variables. Never add Stripe or Payhip secret credentials to the HTML, JavaScript, or repository.

## Checkout and consent

The Payhip embed is loaded only after the visitor accepts optional cookies. The loader explicitly initialises Payhip after the window load event, protects Payhip's iframe query parameters from hash-based navigation, and provides retry and direct-product fallbacks if the embed fails. The choice is stored in the browser for six months and can be changed through **Cookie settings** in the footer.

Update the Payhip product key and fallback product URL together in `cookie-consent.js` and `index.html` if the product changes.

The consent mechanism is a technical aid, not a substitute for maintaining suitable privacy, cookie, refund, and business-information policies.

## Search indexing

`robots.txt` permits normal indexing and points crawlers to `sitemap.xml`. Update both files if the production domain or site path changes.

## Licence

The site code is available under the MIT Licence. Branding, written content, images, and paid digital products are excluded and remain protected. See `LICENSE.txt`.
