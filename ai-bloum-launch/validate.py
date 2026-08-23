"""Validate the landing page with Playwright — check 404s, console errors, render."""
from playwright.sync_api import sync_playwright
import sys
import io

# Force UTF-8 stdout for Vietnamese
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

URL = "http://localhost:8766/"

failed_requests = []
console_errors = []

def on_response(resp):
    if resp.status >= 400:
        failed_requests.append(f"  [{resp.status}] {resp.url}")

def on_console(msg):
    if msg.type == "error":
        console_errors.append(f"  {msg.text}")

def on_pageerror(err):
    console_errors.append(f"  PAGE ERROR: {err}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.on("response", on_response)
    page.on("console", on_console)
    page.on("pageerror", on_pageerror)

    print(f"Loading {URL}...")
    page.goto(URL, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)

    # Trigger IntersectionObserver by scrolling through the whole page
    page.evaluate("""async () => {
        const height = document.body.scrollHeight;
        const step = window.innerHeight * 0.7;
        for (let y = 0; y < height; y += step) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 200));
        }
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 500));
    }""")
    page.wait_for_timeout(1500)

    # Screenshot after scroll
    page.screenshot(path="./validate_hero.png", full_page=False)
    page.screenshot(path="./validate_full.png", full_page=True)
    print("Screenshots saved.")

    # Force all lazy images to load by removing loading=lazy
    page.evaluate("""() => {
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            img.loading = 'eager';
        });
    }""")
    page.wait_for_timeout(2000)

    # Check media
    media_check = page.evaluate("""() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const vids = Array.from(document.querySelectorAll('video source'));
        return {
            imgCount: imgs.length,
            vidCount: vids.length,
            imgs: imgs.map(i => ({src: i.src, complete: i.complete, w: i.naturalWidth, h: i.naturalHeight})),
            vids: vids.map(v => ({src: v.src, type: v.type})),
        };
    }""")
    print(f"\nMedia check: {media_check['imgCount']} images, {media_check['vidCount']} video sources")
    for i in media_check['imgs']:
        ok = i['complete'] and i['w'] > 0
        print(f"  {'OK ' if ok else 'FAIL'}  {i['src']}  ({i['w']}x{i['h']})")
    for v in media_check['vids']:
        print(f"  VID  {v['src']}  ({v['type']})")

    # Check that all major sections are present and visible
    sections = page.evaluate("""() => {
        const checks = [
            {name: 'hero', sel: '.hero__title'},
            {name: 'pain', sel: '.pain__grid'},
            {name: 'pivot', sel: '.pivot__title'},
            {name: 'feature1', sel: '.feature:not(.feature--alt) .feature__title'},
            {name: 'feature2', sel: '.feature.feature--alt .feature__title'},
            {name: 'stats', sel: '.stat__num'},
            {name: 'steps', sel: '.step__title'},
            {name: 'cta', sel: '.cta__title'},
            {name: 'footer', sel: '.footer'},
        ];
        return checks.map(c => {
            const el = document.querySelector(c.sel);
            if (!el) return {...c, found: false};
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return {
                ...c,
                found: true,
                text: el.textContent.slice(0, 50),
                width: Math.round(r.width),
                height: Math.round(r.height),
                opacity: style.opacity,
                display: style.display,
                visibility: style.visibility,
            };
        });
    }""")
    print(f"\nSection checks:")
    for s in sections:
        flag = "OK " if (s.get('found') and s.get('opacity') not in ['0']) else "FAIL"
        text = s.get('text', '')[:50]
        op = s.get('opacity', '?')
        print(f"  {flag}  {s['name']:12s}  opacity={op}  text='{text}'")

    print(f"\nFailed requests: {len(failed_requests)}")
    for r in failed_requests:
        print(r)

    print(f"\nConsole errors: {len(console_errors)}")
    for e in console_errors:
        print(e)

    browser.close()

# Validate
all_ok = True
for s in sections:
    if not s.get('found') or s.get('opacity') == '0':
        all_ok = False
if failed_requests or console_errors:
    all_ok = False

if all_ok:
    print("\n=== VALIDATION PASSED ===")
    sys.exit(0)
else:
    print("\n=== VALIDATION FAILED ===")
    sys.exit(1)
