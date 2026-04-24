# System 5/95 — Static Website

One-page multilingual presentation site. Open `index.html` in a browser.

**For full functionality** (content.json fetch) run a local server:
```bash
cd /path/to/my-site
python3 -m http.server 8080
# then open http://localhost:8080
```

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page markup — no hardcoded text |
| `style.css` | All styles |
| `script.js` | Language switching, rendering, form |
| `content.json` | All copy in 9 languages + media paths |
| `images/` | Photos (drop files here, no code changes needed) |

---

## Editing text — content.json

All copy lives in `content.json`. Structure:

```json
{
  "_media": { ... },   ← photo paths (shared across all languages)
  "en": { ... },
  "ja": { ... },
  "ru": { ... },
  ...
}
```

Each language object has these keys:
`meta`, `nav`, `hero`, `stats`, `about`, `team`, `devices`, `showrooms`, `studios`, `moxi`, `software`, `partnership`, `form`, `footer`

**Example** — change the EN hero subtitle:
```json
"en": {
  "hero": {
    "subtitle": "Your new subtitle here.",
    ...
  }
}
```

**Team member bio** — inside `team.members` array:
```json
"team": {
  "members": [
    { "id": "vg", "name": "Vitaly Golovan", "initials": "VG",
      "role": "Founder", "bio": "Bio text here." },
    ...
  ]
}
```

**Device card** — inside `devices.list` array:
```json
"devices": {
  "list": [
    { "id": "moxi", "name": "Moxi",
      "zones": "Neck, shoulders, back",
      "functions": "Gentle directed heat..." },
    ...
  ]
}
```

---

## Adding photos

Drop photos into the `images/` folder. No code changes required — the site auto-detects each file. If a file is missing, a gradient placeholder with the block name is shown instead.

### Expected filenames

**Hero background**
```
images/hero-bg.jpg
```

**Team portraits** (4:5 ratio recommended, min 800px wide)
```
images/team-vg.jpg      ← Vitaly Golovan
images/team-an.jpg      ← Akio Nakashima
images/team-ao.jpg      ← Alex Okubo
images/team-ay.jpg      ← Akihiko Yamamoto
images/team-mw.jpg      ← Miki Watanabe
images/team-tm.jpg      ← Tatsuyuki Maeda
images/team-sk.jpg      ← Shotaro Kawamura
```

**Device product shots** (clean background, 4:3 or 1:1, min 1000px)
```
images/device-moxi.jpg
images/device-novuheat.jpg
images/device-novueye.jpg
images/device-spinesystem.jpg
images/device-bodyhealth.jpg
```

**Section tiles** (16:9 or 4:3, min 1400px wide)
```
images/section-showrooms.jpg
images/section-studios.jpg
images/section-moxi-yoga.jpg
images/section-software-ai.jpg
```

> **Tip:** Convert originals to WebP for best performance:
> ```bash
> cwebp -q 82 input.jpg -o images/team-vg.webp
> ```

---

## Language switcher

Dropdown in the header. Order: EN → JA → ES → RU → DE → UK → FR → HI → PT

Language preference is saved in `localStorage` under key `system595.lang`.  
URL override: `index.html?lang=ru`

---

## Adding a 10th language

1. Add a new key in `content.json` at the same level as `"en"`, `"ja"`, etc.
2. Add the language code to `LANG_ORDER` array at the top of `script.js`.
3. Add a `<li>` in `#lang-list` in `index.html`.
4. Add the `<link rel="alternate" hreflang="xx">` tag in `<head>`.
