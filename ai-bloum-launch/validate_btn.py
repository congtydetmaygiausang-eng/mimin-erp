"""Quick check: floating button + new CTA both link to dashboard."""
from playwright.sync_api import sync_playwright
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

URL = "http://localhost:8767/"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto(URL, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)

    # Check floating CTA exists and is visible
    floating = page.evaluate("""() => {
        const el = document.querySelector('.floating-cta');
        if (!el) return {found: false};
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return {
            found: true,
            text: el.innerText.replace(/\\s+/g, ' ').trim(),
            href: el.getAttribute('href'),
            target: el.getAttribute('target'),
            rel: el.getAttribute('rel'),
            visible: r.width > 0 && r.height > 0,
            width: Math.round(r.width),
            height: Math.round(r.height),
            bottom: Math.round(window.innerHeight - r.bottom),
            right: Math.round(window.innerWidth - r.right),
            color: style.color,
            background: style.backgroundColor,
        };
    }""")
    print(f"Floating CTA: {floating}")

    # Check final CTA primary
    final_cta = page.evaluate("""() => {
        const cta = document.querySelector('.cta .btn--primary');
        if (!cta) return {found: false};
        return {
            found: true,
            text: cta.innerText.replace(/\\s+/g, ' ').trim(),
            href: cta.getAttribute('href'),
            target: cta.getAttribute('target'),
        };
    }""")
    print(f"Final CTA:   {final_cta}")

    # Take a screenshot to verify visual
    page.screenshot(path="./validate_btn.png", full_page=False)

    # Validate
    ok = (floating.get('found') and floating.get('visible')
          and 'zlsfdvtryzzw2' in floating.get('href', '')
          and floating.get('target') == '_blank'
          and 'zlsfdvtryzzw2' in final_cta.get('href', ''))

    browser.close()
    if ok:
        print("\n=== BUTTON CHECK PASSED ===")
    else:
        print("\n=== BUTTON CHECK FAILED ===")
        sys.exit(1)
