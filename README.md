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
images/team-sk.jpg      ← Shotaro Tamura
```

**Device product shots** (clean background, 4:3 or 1:1, min 1000px)
```
images/device-moxi.jpg
images/device-novuheat.jpg
images/device-novueye.jpg
images/device-spinesystem.jpg
images/device-bodyhealth.jpg
```

**Section tiles** (fallback when no gallery, 16:9 or 4:3, min 1400px wide)
```
images/section-showrooms.jpg
images/section-studios.jpg
images/section-moxi-yoga.jpg
images/section-software-ai.jpg
```

---

## Adding photos / videos to the gallery carousels

Each section (Devices, Showrooms, Studios, Moxi Yoga, Software + AI) has a horizontal scroll gallery. To add media:

### Step 1 — Put the file in `images/`
```
images/showroom-1.jpg
images/studio-intro.mp4
```
Recommended sizes: **JPG/WebP** at 2400×1500 px (16:10), quality 85.  
For **video**: H.264 MP4, max 10 MB, 1920×1200 px.

### Step 2 — Open `content.json` and find `_media.gallery`

```json
{
  "_media": {
    "gallery": {
      "showrooms": [ ... ],   ← add here for Showrooms
      "studios":   [ ... ],   ← add here for Studios
      "moxi":      [ ... ],   ← add here for Moxi Yoga
      "software":  [ ... ],   ← add here for Software + AI
      "devices":   [ ... ]    ← add here for Devices gallery
    }
  }
}
```

### Step 3 — Add an object to the array

**Image:**
```json
{
  "type": "image",
  "src": "images/showroom-1.jpg",
  "alt": {
    "en": "Tokyo Showroom interior",
    "ru": "Интерьер шоурума Токио",
    "ja": "東京ショールーム内観"
  },
  "caption": {
    "en": "Tokyo Showroom 2024",
    "ru": "Шоурум Токио 2024",
    "ja": "東京ショールーム 2024"
  }
}
```

**Video:**
```json
{
  "type": "video",
  "src": "images/showroom-tour.mp4",
  "showControls": true,
  "alt":     { "en": "Showroom walkthrough video" },
  "caption": { "en": "Tokyo Showroom — walkthrough" }
}
```

### Step 4 — Save and refresh

The gallery renders automatically.  
- **0 items** → original split layout with placeholder tile  
- **1 item** → single full-width frame (no arrows)  
- **2+ items** → scrollable carousel with arrows (desktop) and swipe (mobile)

> **Tip:** You only need to add translations you have ready. Missing languages fall back to English automatically.

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
