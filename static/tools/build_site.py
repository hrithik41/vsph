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
LOGO = (SRC / 'components/logo.svg').read_text()

def render_component(name, current_page=""):
    path = SRC / 'components' / f'{name}.html'
    if not path.exists():
        return ""
    content = path.read_text()
    
    # Simple logic to highlight the active navigation link
    content = content.replace(f'href="{current_page}.html"', f'href="{current_page}.html" aria-current="page"')
    
    # Inject the VSPH logo
    content = content.replace('{{ LOGO }}', LOGO)
    return content

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
{render_component('navbar', key)}
{source.read_text().replace('{{ include_hero }}', render_component('hero'))}
{render_component('footer', key)}
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
