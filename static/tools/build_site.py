#!/usr/bin/env python3
"""Optional authoring helper. Outputs five standalone HTML/CSS/JS page sets.
The resulting site needs only a static host; Python is not a runtime dependency.
"""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'src'
PAGES = {
    'index': ('Home', 'VSPH — Building What’s Next.', 'VSPH builds scalable web, mobile and enterprise applications. Thoughtful software that helps businesses streamline work, connect experiences and grow.'),
    'about': ('About VSPH', 'About VSPH — People. Products. Possibilities.', 'Get to know VSPH: a software partner connecting business understanding with useful digital solutions. Explore our mission, vision and values.'),
    'services': ('Services', 'Our Services — VSPH', 'Explore VSPH’s web solutions, mobile applications, custom software, and collaboration and consulting capabilities.'),
    'approach': ('Approach', 'Think. Build. Grow. — The VSPH Approach', 'From understanding the challenge to shaping the solution and enabling what follows. Explore VSPH’s thoughtful approach to software.'),
    'contact': ('Contact', 'Discuss Your Project — VSPH', 'Tell VSPH what you want to build. Prepare your project enquiry for web solutions, mobile applications, custom software or consulting.'),
}
ARROW = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>'
LOGO = (SRC / 'components/logo.svg').read_text()

def nav_links(current):
    return ''.join(f'<a class="nav-link" href="{key}.html"{(" aria-current=\"page\"" if key == current else "")}>{label}</a>' for key, (label, _, _) in PAGES.items())

def header(current):
    links = nav_links(current)
    return f'''<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header" id="top">
  <div class="container header-inner">
    <a class="brand-link" href="index.html" aria-label="VSPH home">{LOGO}</a>
    <nav class="desktop-nav" aria-label="Main navigation">{links}</nav>
    <a class="button button-primary header-cta" href="contact.html">Discuss your project {ARROW}</a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-navigation" aria-label="Open navigation">
      <svg data-menu-open class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      <svg data-menu-close class="icon" viewBox="0 0 24 24" aria-hidden="true" hidden><path d="m6 6 12 12M6 18 18 6"/></svg>
    </button>
  </div>
  <nav class="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation" hidden>{links}<a class="button button-primary" href="contact.html">Discuss your project {ARROW}</a></nav>
</header>'''

def footer():
    return f'''<footer class="site-footer">
  <div class="container">
    <div class="footer-main">
      <div class="footer-brand"><a class="brand-link" href="index.html" aria-label="VSPH home">{LOGO}</a><p>Enterprise Software Solutions<br>for a Smarter Tomorrow.</p></div>
      <div class="footer-column"><h2>Explore VSPH</h2><ul><li><a href="about.html">About VSPH</a></li><li><a href="services.html">Our services</a></li><li><a href="approach.html">Our approach</a></li><li><a href="contact.html">Discuss your project</a></li></ul></div>
      <div class="footer-column"><h2>Our capabilities</h2><ul><li><a href="services.html#web">Web Solutions</a></li><li><a href="services.html#mobile">Mobile Applications</a></li><li><a href="services.html#software">Custom Software</a></li><li><a href="services.html#consulting">Collaboration &amp; Consulting</a></li></ul></div>
    </div>
    <div class="footer-bottom"><p>© <span data-year>2026</span> VSPH. All rights reserved.</p><span class="footer-signature">PEOPLE &nbsp;|&nbsp; PRODUCTS &nbsp;|&nbsp; POSSIBILITIES</span><a class="back-top" href="#top">Back to top <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V4m-6 6 6-6 6 6"/></svg></a></div>
  </div>
</footer>'''

def build():
    for key, (_, title, description) in PAGES.items():
        source = SRC / 'pages' / f'{key}.html'
        if not source.exists():
            print(f'Skipping {key}: awaiting page content.')
            continue
        html = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#00255A">
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(description, quote=True)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="VSPH">
  <meta property="og:title" content="{escape(title, quote=True)}">
  <meta property="og:description" content="{escape(description, quote=True)}">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="assets/InterVariable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{key}.css">
  <script src="{key}.js" defer></script>
</head>
<body>
{header(key)}
{source.read_text()}
{footer()}
</body>
</html>
'''
        (ROOT / f'{key}.html').write_text(html)
        for ext in ('css', 'js'):
            extra = SRC / 'pages' / f'{key}.{ext}'
            content = (SRC / f'base.{ext}').read_text()
            if extra.exists():
                content += f'\n/* {key.title()} page */\n' + extra.read_text()
            (ROOT / f'{key}.{ext}').write_text(content)
        print(f'Built {key}.html + {key}.css + {key}.js')

if __name__ == '__main__':
    build()
