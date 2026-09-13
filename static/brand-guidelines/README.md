# VSPH brand guidelines

The finished guide contains 32 landscape pages covering brand foundations, logo use, color, typography, visual language, voice, messaging, business applications and production guidance.

- Final PDF: `VSPH-Brand-Guidelines.pdf`
- Self-contained layout source: `VSPH-Brand-Guidelines.html`
- Editable Canva design: https://www.canva.com/d/mdKGPiH3CeqEQNL
- Canva design ID: `DAHVDXRqmjM`

The supplied VSPH screenshot establishes the company name, messages, blue palette, Inter typography and personality. The Inviya document informed the landscape format, organization and use of diagrams. Its company-specific content and proprietary identity devices were not reused.

The logo has been reconstructed from the VSPH screenshot for demonstration. Compare it with the original vector master before production. Added mission, vision and implementation specifications are proposed standards. Bracketed stationery fields require verified company information. The PDF is intended for screen review; printer-specific preparation and formal accessibility validation remain production tasks.

## Validation

- 32 HTML pages and 32 PDF pages.
- Inter font loaded and embedded through the source document.
- No missing images, page overflow, footer overlap or clipped text found in the final automated layout check.
- Every page visually reviewed; positioning, clear-space and presentation examples refined after review.
- Final Canva import verified at 32 pages; representative pages 1, 8, 14, 20, 21, 28 and 32 visually inspected.
- Palette and icon specifications checked in the imported editable text.

## Sources

- User-provided VSPH screenshot.
- User-provided `/Users/hrithik/Desktop/inviya_guidelines.pdf`.
- Inter: https://rsms.me/inter/
- W3C text contrast guidance: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

## Generated imagery

Asset: `assets/imagery-moodboard.png`, 2172 × 724 px. Created using the built-in image-generation tool. It is an illustrative photography direction, not documentary photography of VSPH employees, products or premises.

Prompt:

> Use case: photorealistic-natural. Asset type: one editorial photography moodboard for VSPH software-company brand guidelines. Create one wide landscape triptych, three equally sized photographic panels side by side, filling the canvas edge to edge with no borders, no gaps, and no text. Prefer a 3:1 overall aspect ratio. Panel 1: candid diverse Indian software product team collaborating naturally around a laptop at a table in a bright, architecturally refined contemporary office. Real people at work, believable interaction and hands, unposed editorial photography. Panel 2: close-up of human hands working with a software interface on a laptop, premium tactile detail, simple abstract interface with no readable private data or text, natural window light. Panel 3: sophisticated modern glass building architecture with blue reflections, an upward perspective communicating meaningful business growth in an understated way. Style: realistic premium editorial business photography, natural skin tones, subtle film-like texture, genuine materials, controlled daylight, clean compositions. Consistent visual grade across all three images, understated navy, core-blue and cyan touches, professional and human. Constraints: generic inspirational moodboard, not documentary evidence of VSPH's actual employees or offices. No branding, no logos, no watermarks, no text, no stock handshake, no robots, no globes, no artificial neon or science fiction holograms.

## Rebuild

Run `python3 build_guidelines.py`, then `node tools/render-brand.mjs VSPH-Brand-Guidelines.html`. The renderer uses local Google Chrome through CDP, with a temporary empty browser profile. No Node dependencies are required. The HTML is self-contained for direct Canva import, with each `.page` annotated `data-document-role="page"`.

Page previews and the machine-readable layout check are in `rendered-pages/`. Canva previews are in `canva-previews/`.
