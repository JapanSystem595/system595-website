(function () {
  'use strict';

  var LANG_ORDER = ['en','ja','es','ru'];
  var DEFAULT_LANG = 'en';
  var STORAGE_KEY = 'system595.lang';
  var content = null;

  var PAGE_META = {
    'about.html':       { title: 'about.title',       desc: 'about.subtitle'       },
    'devices.html':     { title: 'devices.title',      desc: 'devices.subtitle'     },
    'showrooms.html':   { title: 'showrooms.title',    desc: 'showrooms.subtitle'   },
    'studios.html':     { title: 'studios.franchise.meta.title', desc: 'studios.franchise.meta.description',
                          titleFallback: 'studios.title', descFallback: 'studios.subtitle' },
    'moxi.html':        { title: 'moxi.title',         desc: 'moxi.subtitle'        },
    'software.html':    { title: 'software.title',     desc: 'software.subtitle'    },
    'partnership.html': { title: 'partnership.title',  desc: 'partnership.subtitle' },
    // NovuEye IV: its own static page (novueye.*); the title is used as written
    'device-novueye.html':     { title: 'novueye.meta.title', desc: 'novueye.meta.description', titleSuffix: ' | System 5/95' },
    'device-toprelax.html':    { device: 'toprelax'    },
    'device-novuheat.html':    { device: 'novuheat'    },
    'device-moxi.html':        { device: 'moxi'        },
    'device-bodyhealth.html':  { device: 'bodyhealth'  },
    'device-watersystem.html': { device: 'watersystem' },
  };

  /* ─── helpers ─── */

  function get(obj, path) {
    return path.split('.').reduce(function (o, k) {
      return o == null ? undefined : o[k];
    }, obj);
  }

  function escHtml(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Pick localised string from {en:…, ru:…} or return fallback
  function localText(obj, lang) {
    if (!obj) return '';
    return obj[lang] || obj[DEFAULT_LANG] || '';
  }

  function detectLang() {
    try {
      var p = new URLSearchParams(window.location.search).get('lang');
      if (p && LANG_ORDER.indexOf(p) !== -1) return p;
    } catch (e) {}
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s && LANG_ORDER.indexOf(s) !== -1) return s;
    } catch (e) {}
    var nav = ((navigator.language || 'en') + '').slice(0,2).toLowerCase();
    return LANG_ORDER.indexOf(nav) !== -1 ? nav : DEFAULT_LANG;
  }

  /* ─── i18n apply ─── */

  function applyLang(lang) {
    var dict = content[lang] || content[DEFAULT_LANG];
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = get(dict, key);
      if (val == null) return;
      var attr = el.getAttribute('data-i18n-attr');
      if (attr) el.setAttribute(attr, val);
      else el.textContent = val;
    });

    renderTeam(dict);
    renderDevices(dict);
    renderDeviceTiles(dict);
    var landingMeta = renderDeviceLanding(dict);
    applyBuyLinks(dict);
    applyNeOptional();
    applyNeTypography(lang);
    renderGalleries(lang);
    updateDropdownActive(lang);
    initReveal();

    // Per-page title and meta description for section pages
    var pageName = (window.location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    var pm = PAGE_META[pageName + '.html'];
    if (pm) {
      var sTitle = pm.device ? (landingMeta && landingMeta.title) : get(dict, pm.title);
      var sDesc  = pm.device ? (landingMeta && landingMeta.desc)  : get(dict, pm.desc);
      // pages whose own meta keys may not be filled in every language yet
      if (!sTitle && pm.titleFallback) sTitle = get(dict, pm.titleFallback);
      if (!sDesc && pm.descFallback) sDesc = get(dict, pm.descFallback);
      if (sTitle) {
        var fullTitle = pm.titleSuffix ? sTitle + pm.titleSuffix : 'System 5/95 — ' + sTitle;
        document.title = fullTitle;
        var ogT = document.querySelector('meta[property="og:title"]');
        if (ogT) ogT.setAttribute('content', fullTitle);
      }
      if (sDesc) {
        var descEl = document.querySelector('meta[name="description"]');
        if (descEl) descEl.setAttribute('content', sDesc);
        var ogD = document.querySelector('meta[property="og:description"]');
        if (ogD) ogD.setAttribute('content', sDesc);
      }
    }

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  /* ─── shop links ([data-buy-link] → novueye.offer.buyUrl) ─── */

  function applyBuyLinks(dict) {
    var links = document.querySelectorAll('[data-buy-link]');
    if (!links.length) return;
    var url = get(dict, 'novueye.offer.buyUrl') || get(content[DEFAULT_LANG], 'novueye.offer.buyUrl');
    if (!url || !/^https?:\/\//i.test(url)) return;   // keep the static href
    links.forEach(function (a) { a.setAttribute('href', url); });
  }

  /* ─── NovuEye page: a text left empty in content.json is not shown.
         Blocks marked data-ne-opt disappear when all their texts are empty
         (used by the Japanese version: no function lines, no price, no buy
         buttons). Switching language shows them again. ─── */

  function applyNeOptional() {
    var root = document.getElementById('novueye-page');
    if (!root) return;
    function blank(el) { return !/\S/.test(el.textContent); }
    var texts = root.querySelectorAll('[data-i18n]:not([data-i18n-attr])');
    texts.forEach(function (el) {
      if (el.closest('#device-tiles')) return;
      el.hidden = blank(el);
    });
    root.querySelectorAll('[data-ne-opt]').forEach(function (box) {
      var keys = box.querySelectorAll('[data-i18n]:not([data-i18n-attr])');
      var filled = false;
      keys.forEach(function (k) { if (!blank(k)) filled = true; });
      box.hidden = keys.length > 0 && !filled;
    });
  }

  /* ─── NovuEye page typography: no dash or short word left hanging,
         curly quotes in English (the texts themselves stay verbatim) ─── */

  function applyNeTypography(lang) {
    var root = document.getElementById('novueye-page');
    if (!root || lang === 'ja') return;
    var NB = '\u00a0';
    var tiles = document.getElementById('device-tiles');   // shared tile copy stays untouched
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return tiles && tiles.contains(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      var t = node.nodeValue, o = t;
      if (!/\S/.test(t)) continue;
      t = t.replace(/ (\u2014|\u2013)/g, NB + '$1')           // dash never opens a line
           .replace(/(\u2116|No\.|N\.\u00ba|n\.\u00ba) (?=\d)/g, '$1' + NB)  // No. 0001
           .replace(/(\d) (?=\d{3}\b)/g, '$1' + NB)            // 3 000
           .replace(/(\d) (?=%)/g, '$1' + NB)                  // 95 %
           .replace(/NovuEye IV/g, 'NovuEye' + NB + 'IV');
      if (lang === 'ru') {
        t = t.replace(/(^|[\s\u00a0(«])([А-Яа-яЁё]{1,2}) /g, '$1$2' + NB)
             .replace(/(^|[\s\u00a0(«])([А-Яа-яЁё]{1,2}) /g, '$1$2' + NB);
      }
      if (lang === 'en') {
        t = t.replace(/"([^"]+)"/g, '\u201c$1\u201d').replace(/(\w)'(\w)/g, '$1\u2019$2');
      }
      if (t !== o) node.nodeValue = t;
    }
  }

  /* ─── team card renderer ─── */

  function teamImgSrc(id) {
    return content._media && content._media.team ? content._media.team[id] : null;
  }

  function deviceImgSrc(id) {
    return content._media && content._media.devices ? content._media.devices[id] : null;
  }

  function renderTeam(dict) {
    var grid = document.getElementById('team-grid');
    if (!grid) return;
    var members = dict.team && dict.team.members ? dict.team.members : [];
    grid.innerHTML = members.map(function (m) {
      var imgSrc = teamImgSrc(m.id);
      var webpSrc = imgSrc ? imgSrc.replace(/\.jpg$/i, '.webp') : null;
      var imgHtml = imgSrc
        ? '<picture>'
          + '<source srcset="' + webpSrc + '" type="image/webp">'
          + '<img class="avatar-img" src="' + imgSrc + '" alt="' + escHtml(m.name) + '" loading="lazy" onerror="this.closest(\'picture\').style.display=\'none\';this.closest(\'picture\').nextElementSibling.style.display=\'flex\'">'
          + '</picture>'
        : '';
      return '<article class="team-card">'
        + '<div class="avatar" aria-hidden="true">'
        + imgHtml
        + '<span class="avatar-initials" style="' + (imgSrc ? 'display:none' : '') + '">' + escHtml(m.initials) + '</span>'
        + '</div>'
        + '<h4>' + escHtml(m.name) + '</h4>'
        + '<p class="role">' + escHtml(m.role) + '</p>'
        + '<p class="bio">' + escHtml(m.bio) + '</p>'
        + '</article>';
    }).join('');
  }

  function renderDevices(dict) {
    var grid = document.getElementById('device-grid');
    if (!grid) return;
    var devices = dict.devices && dict.devices.list ? dict.devices.list : [];
    var zLabel = dict.devices ? dict.devices.zonesLabel : 'Areas';
    var fLabel = dict.devices ? dict.devices.functionsLabel : 'Functions';
    grid.innerHTML = devices.map(function (d) {
      var imgSrc = deviceImgSrc(d.id);
      var imgHtml = imgSrc
        ? '<img class="device-img" src="' + imgSrc + '" alt="' + escHtml(d.name) + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
        : '';
      var descHtml = d.description
        ? '<p class="device-desc">' + escHtml(d.description) + '</p>'
        : '';
      var functionsRow = d.functions
        ? '<dt>' + escHtml(fLabel) + '</dt><dd>' + escHtml(d.functions) + '</dd>'
        : '';
      return '<article class="device-card">'
        + '<div class="device-image">'
        + imgHtml
        + '<span class="device-fallback" style="' + (imgSrc ? 'display:none' : '') + '">' + escHtml(d.name) + '</span>'
        + '</div>'
        + '<h4>' + escHtml(d.name) + '</h4>'
        + descHtml
        + '<dl>'
        + '<dt>' + escHtml(zLabel) + '</dt><dd>' + escHtml(d.zones) + '</dd>'
        + functionsRow
        + '</dl>'
        + '</article>';
    }).join('');
  }

  /* ─── device tiles (devices.html + "other devices" on landings) ─── */

  // Split a text block into paragraphs; drops the "* " bullet marks of the source copy
  function paragraphs(text) {
    if (!text) return [];
    if (Array.isArray(text)) return text.filter(Boolean);
    return String(text).split(/\n\s*\n/).map(function (p) {
      return p.replace(/^\s*\*\s*/, '').trim();
    }).filter(Boolean);
  }

  // Escape for uppercase labels: unit symbols such as "pH" keep their own case
  function escCaps(text) {
    return escHtml(text).replace(/(^|[^A-Za-z])(pH)(?![A-Za-z])/g, '$1<span class="keep-case">$2</span>');
  }

  // eager: small PNGs in a swipeable row load up front — a lazy image inside a
  // horizontally scrolled row can stay unloaded (studios.html five-up row)
  function deviceTileHtml(d, learnMore, compact, eager) {
    var imgSrc = deviceImgSrc(d.id);
    var stage = imgSrc
      ? '<img class="device-tile-img" src="' + escHtml(imgSrc) + '" alt="' + escHtml(d.name) + '" loading="' + (eager ? 'eager' : 'lazy') + '" decoding="async">'
      : '<span class="device-tile-fallback">' + escHtml(d.name) + '</span>';
    return '<a class="device-tile' + (compact ? ' device-tile--compact' : '') + '" href="device-' + escHtml(d.id) + '.html">'
      + '<div class="device-tile-stage">' + stage + '</div>'
      + '<div class="device-tile-body">'
      + (d.category ? '<p class="device-tile-cat">' + escCaps(d.category) + '</p>' : '')
      + '<h3 class="device-tile-name">' + escHtml(d.name) + '</h3>'
      + (d.tagline ? '<p class="device-tile-tagline">' + escHtml(d.tagline) + '</p>' : '')
      + '<span class="device-tile-more">'
      + (learnMore ? '<span class="device-tile-more-text">' + escHtml(learnMore) + '</span>' : '')
      + '<span class="device-tile-arrow" aria-hidden="true">&#8594;</span>'
      + '</span>'
      + '</div>'
      + '</a>';
  }

  // data-only="id1,id2,…" limits the row to these devices, in this order;
  // the five-up row (studios.html) uses the compact tile
  function renderDeviceTiles(dict) {
    var grid = document.getElementById('device-tiles');
    if (!grid) return;
    var dv = dict.devices || {};
    var list = dv.list || [];
    var only = grid.getAttribute('data-only');
    if (only) {
      list = only.split(',').map(function (id) {
        return findDevice(list, id.trim());
      }).filter(Boolean);
    }
    var compact = grid.classList.contains('device-tiles--five');
    grid.innerHTML = list.map(function (d) {
      return deviceTileHtml(d, dv.learnMore, compact, compact);
    }).join('');
  }

  /* ─── device landing (device-<id>.html) ─── */

  function findDevice(list, id) {
    for (var i = 0; i < (list || []).length; i++) {
      if (list[i] && list[i].id === id) return list[i];
    }
    return null;
  }

  // Renders the whole landing into <main id="device-landing">; returns {title, desc}
  function renderDeviceLanding(dict) {
    var root = document.getElementById('device-landing');
    var id = document.body ? document.body.getAttribute('data-device') : null;
    if (!root || !id) return null;

    var dv = dict.devices || {};
    var list = dv.list || [];
    var d = findDevice(list, id);
    if (!d) {
      // language without this device yet: fall back to the default language
      var def = content[DEFAULT_LANG] && content[DEFAULT_LANG].devices;
      list = def && def.list ? def.list : [];
      d = findDevice(list, id);
    }
    if (!d) { root.innerHTML = ''; return null; }

    var L = dv.landing || {};
    var methodsDict = dv.methods || {};
    var ctaP = L.ctaPrimary || get(dict, 'hero.cta') || '';
    var ctaS = L.ctaSecondary || get(dict, 'nav.devices') || '';

    function actions() {
      if (!ctaP && !ctaS) return '';
      return '<div class="dl-actions">'
        + (ctaP ? '<a href="partnership.html" class="btn-primary">' + escHtml(ctaP) + '</a>' : '')
        + (ctaS ? '<a href="devices.html" class="btn-ghost">' + escHtml(ctaS) + '</a>' : '')
        + '</div>';
    }
    function label(t) { return t ? '<p class="dl-label">' + escHtml(t) + '</p>' : ''; }
    function h2(t)    { return t ? '<h2 class="dl-h2">' + escHtml(t) + '</h2>' : ''; }
    function ps(arr, cls) {
      return arr.map(function (p) {
        return '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + escHtml(p) + '</p>';
      }).join('');
    }
    function section(cls, inner) {
      return '<section class="section dl-section ' + cls + '"><div class="container">' + inner + '</div></section>';
    }

    var out = [];
    var imgSrc = deviceImgSrc(d.id);
    var eyebrow = d.category || L.eyebrow || '';

    // 1. Hero
    out.push('<section class="hero dl-hero">'
      + '<div class="container dl-hero-inner">'
      + '<div class="dl-hero-text">'
      + (eyebrow ? '<p class="eyebrow">' + escCaps(eyebrow) + '</p>' : '')
      + '<h1 class="dl-title">' + escHtml(d.name) + '</h1>'
      + (d.tagline ? '<p class="dl-tagline">' + escHtml(d.tagline) + '</p>' : '')
      + (d.lede ? '<p class="dl-lede">' + escHtml(d.lede) + '</p>' : '')
      + actions()
      + '</div>'
      + (imgSrc
          ? '<figure class="dl-hero-media"><img class="dl-hero-img" src="' + escHtml(imgSrc) + '" alt="' + escHtml(d.name) + '"></figure>'
          : '')
      + '</div>'
      + '</section>');

    // 2. Story (falls back to the description until the story copy lands)
    var story = paragraphs(d.story);
    if (!story.length) story = paragraphs(d.description);
    if (story.length) {
      out.push(section('dl-story dl-light', '<div class="dl-row">'
        + '<div class="dl-row-head">' + label(L.storyLabel) + '</div>'
        + '<div class="dl-story-body">' + ps(story) + '</div>'
        + '</div>'));
    }

    // 3. Areas
    if (d.zones) {
      out.push(section('dl-areas dl-white', '<div class="dl-row">'
        + '<div class="dl-row-head">' + label(L.areasLabel || dv.zonesLabel) + '</div>'
        + '<p class="dl-areas-text">' + escHtml(d.zones) + '</p>'
        + '</div>'));
    }

    // 4. Methods
    var specs = Array.isArray(d.specs) ? d.specs.filter(function (s) { return s && (s.label || s.value); }) : [];
    var keys = Array.isArray(d.methodKeys) ? d.methodKeys : [];
    var cards = keys.filter(function (k) { return methodsDict[k] && methodsDict[k].title; });
    if (cards.length) {
      out.push(section('dl-methods dl-light',
        '<div class="dl-head">' + label(L.methodsLabel) + h2(L.methodsTitle) + '</div>'
        + '<div class="method-grid method-grid--n' + cards.length + '">'
        + cards.map(function (k, i) {
            var m = methodsDict[k];
            return '<article class="method-card">'
              + '<span class="method-no">' + (i < 9 ? '0' : '') + (i + 1) + '</span>'
              + '<h3 class="method-title">' + escHtml(m.title) + '</h3>'
              + (m.text ? '<p class="method-text">' + escHtml(m.text) + '</p>' : '')
              + '</article>';
          }).join('')
        + '</div>'));
    } else if (d.functions && !specs.length) {
      // interim: plain functions line until the methods dictionary is filled
      out.push(section('dl-methods dl-light', '<div class="dl-row">'
        + '<div class="dl-row-head">' + label(L.methodsLabel || dv.functionsLabel) + '</div>'
        + '<p class="dl-areas-text dl-functions-text">' + escHtml(d.functions) + '</p>'
        + '</div>'));
    }

    // 5. Extra (novuheat)
    if (d.extra && (d.extra.title || d.extra.body)) {
      out.push(section('dl-extra dl-white', '<div class="dl-extra-grid">'
        + '<div class="dl-extra-head">' + label(L.extraLabel)
        + (d.extra.title ? '<h2 class="dl-h2 dl-extra-title">' + escHtml(d.extra.title) + '</h2>' : '')
        + '</div>'
        + '<div class="dl-extra-body">' + ps(paragraphs(d.extra.body)) + '</div>'
        + '</div>'));
    }

    // 6. Specs (watersystem)
    if (specs.length) {
      out.push(section('dl-specs dl-white', '<div class="dl-row">'
        + '<div class="dl-row-head">' + label(L.specsLabel) + '</div>'
        + '<dl class="dl-specs-table">'
        + specs.map(function (s) {
            return '<div class="dl-spec-row"><dt>' + escCaps(s.label) + '</dt><dd>' + escHtml(s.value) + '</dd></div>';
          }).join('')
        + '</dl>'
        + '</div>'));
    }

    // 7. Trust
    if (L.trustTitle || L.trustBody) {
      var stats = Array.isArray(L.trustStats) ? L.trustStats : [];
      out.push(section('dl-trust', '<div class="dl-trust-inner">'
        + label(L.trustLabel) + h2(L.trustTitle)
        + (L.trustBody ? '<p class="dl-trust-body">' + escHtml(L.trustBody) + '</p>' : '')
        + (stats.length
            ? '<div class="hero-meta dl-trust-stats">' + stats.map(function (s) {
                return '<span><span class="meta-n">' + escHtml(s.n) + '</span><span>' + escHtml(s.l) + '</span></span>';
              }).join('') + '</div>'
            : '')
        + '</div>'));
    }

    // 8. Other devices
    var others = list.filter(function (x) { return x && x.id !== d.id; });
    if (others.length) {
      out.push(section('dl-others dl-light',
        ((L.othersLabel || L.othersTitle) ? '<div class="dl-head">' + label(L.othersLabel) + h2(L.othersTitle) + '</div>' : '')
        + '<div class="device-tiles device-tiles--compact">'
        + others.map(function (x) { return deviceTileHtml(x, dv.learnMore, true); }).join('')
        + '</div>'));
    }

    // 9. Closing call to action
    if (L.ctaTitle) {
      out.push(section('dl-cta', '<div class="dl-cta-inner">'
        + '<h2 class="dl-h2">' + escHtml(L.ctaTitle) + '</h2>'
        + (L.ctaBody ? '<p class="dl-cta-body">' + escHtml(L.ctaBody) + '</p>' : '')
        + actions()
        + '</div>'));
    }

    root.innerHTML = out.join('');
    return { title: d.name, desc: d.tagline || d.lede || d.zones || '' };
  }

  /* ─── gallery / carousel ─── */

  function galleryItems(key) {
    return (content._media && content._media.gallery && content._media.gallery[key]) || [];
  }

  // Build a single slide element (image or video)
  function buildSlide(item, index, total, lang) {
    var alt     = escHtml(localText(item.alt, lang));
    var caption = localText(item.caption, lang);
    var mediaHtml;

    if (item.type === 'video') {
      mediaHtml = '<video class="slide-media" src="' + escHtml(item.src) + '"'
        + ' muted playsinline loop preload="metadata"'
        + (item.showControls ? ' controls' : '')
        + '></video>';
    } else {
      mediaHtml = '<img class="slide-media" src="' + escHtml(item.src) + '"'
        + ' alt="' + alt + '" loading="lazy"'
        + ' onerror="this.style.visibility=\'hidden\'">';
    }

    return '<div class="carousel-slide" role="group" aria-roledescription="slide"'
      + ' aria-label="' + (index + 1) + ' of ' + total + '">'
      + '<figure class="slide-frame">'
      + mediaHtml
      + (caption ? '<figcaption class="slide-caption">' + escHtml(caption) + '</figcaption>' : '')
      + '</figure>'
      + '</div>';
  }

  // Build full carousel HTML string
  function buildCarouselHtml(items, lang, ariaLabel) {
    var total   = items.length;
    var single  = total === 1;
    var slides  = items.map(function (item, i) { return buildSlide(item, i, total, lang); }).join('');

    var dots = items.map(function (_, i) {
      return '<button class="carousel-dot" role="tab"'
        + ' aria-label="Go to slide ' + (i + 1) + '"'
        + ' aria-selected="' + (i === 0 ? 'true' : 'false') + '"'
        + ' data-index="' + i + '">'
        + '</button>';
    }).join('');

    return '<div class="carousel' + (single ? ' carousel--single' : '') + '"'
      + ' role="region" aria-roledescription="carousel"'
      + ' aria-label="' + escHtml(ariaLabel) + '" tabindex="0">'
      + '<div class="carousel-track">' + slides + '</div>'
      + (!single
          ? '<button class="carousel-btn carousel-prev" aria-label="Previous slide">&#8249;</button>'
            + '<button class="carousel-btn carousel-next" aria-label="Next slide">&#8250;</button>'
          : '')
      + (!single
          ? '<div class="carousel-dots" role="tablist" aria-label="Slide indicators">' + dots + '</div>'
          : '')
      + '</div>';
  }

  // Render galleries for all 5 sections
  function renderGalleries(lang) {
    var sections = [
      { key: 'showrooms', mountId: 'gallery-showrooms', splitId: 'split-showrooms', proseId: 'prose-showrooms', label: 'Showroom Gallery' },
      { key: 'studios',   mountId: 'gallery-studios',   splitId: 'split-studios',   proseId: 'prose-studios',   label: 'Studio Gallery' },
      { key: 'moxi',      mountId: 'gallery-moxi',       splitId: 'split-moxi',      proseId: 'prose-moxi',      label: 'Moxi Yoga Gallery' },
      { key: 'software',  mountId: 'gallery-software',   splitId: 'split-software',  proseId: 'prose-software',  label: 'Software Gallery' }
    ];

    sections.forEach(function (s) {
      var items = galleryItems(s.key);
      var mount = document.getElementById(s.mountId);
      var split = document.getElementById(s.splitId);
      var prose = document.getElementById(s.proseId);
      if (!mount) return;

      if (items.length > 0) {
        mount.innerHTML = buildCarouselHtml(items, lang, s.label);
        mount.hidden = false;
        if (split) split.hidden = true;
        if (prose) prose.hidden = false;
        initCarousel(mount.querySelector('.carousel'), items);
      } else {
        mount.hidden = true;
        if (split) split.hidden = false;
        if (prose) prose.hidden = true;
      }
    });

    // Devices gallery (carousel + keep grid below)
    var devItems = galleryItems('devices');
    var devMount = document.getElementById('gallery-devices');
    var devGrid  = document.getElementById('device-grid');
    if (devMount) {
      if (devItems.length > 0) {
        devMount.innerHTML = buildCarouselHtml(devItems, lang, 'Device Gallery');
        devMount.hidden = false;
        initCarousel(devMount.querySelector('.carousel'), devItems);
      } else {
        devMount.hidden = true;
      }
      // device-grid always visible (cards shown below gallery or alone)
      if (devGrid) devGrid.hidden = false;
    }
  }

  // Attach all interactive behaviour to a rendered carousel
  function initCarousel(el, items) {
    if (!el) return;
    var track = el.querySelector('.carousel-track');
    var prev  = el.querySelector('.carousel-prev');
    var next  = el.querySelector('.carousel-next');
    var dots  = el.querySelectorAll('.carousel-dot');
    var slides = el.querySelectorAll('.carousel-slide');
    var total = slides.length;
    if (total <= 1) return;

    function getActiveIndex() {
      var slideW = slides[0].offsetWidth + 16; // width + gap
      return Math.round(track.scrollLeft / slideW);
    }

    function scrollTo(index) {
      index = Math.max(0, Math.min(total - 1, index));
      slides[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }

    function updateControls() {
      var idx = getActiveIndex();
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx >= total - 1;
      dots.forEach(function (d, i) {
        d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      });
    }

    if (prev) prev.addEventListener('click', function () { scrollTo(getActiveIndex() - 1); });
    if (next) next.addEventListener('click', function () { scrollTo(getActiveIndex() + 1); });

    dots.forEach(function (d) {
      d.addEventListener('click', function () { scrollTo(Number(d.dataset.index)); });
    });

    track.addEventListener('scroll', updateControls, { passive: true });

    // Keyboard: ← → when carousel is focused
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { scrollTo(getActiveIndex() - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { scrollTo(getActiveIndex() + 1); e.preventDefault(); }
    });

    updateControls();

    // Video autoplay via IntersectionObserver
    if ('IntersectionObserver' in window) {
      el.querySelectorAll('video.slide-media').forEach(function (vid) {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) vid.play().catch(function(){});
            else vid.pause();
          });
        }, { threshold: 0.5 });
        obs.observe(vid);
      });
    }
  }

  /* ─── lang dropdown ─── */

  function initDropdown() {
    var dropdown = document.getElementById('lang-dropdown');
    var btn      = document.getElementById('lang-btn');
    var list     = document.getElementById('lang-list');
    if (!dropdown || !btn || !list) return;

    function items() { return Array.prototype.slice.call(list.querySelectorAll('[data-lang]')); }
    items().forEach(function (li) { li.setAttribute('tabindex', '-1'); });

    function isOpen() { return dropdown.getAttribute('aria-expanded') === 'true'; }
    function closeDropdown(returnFocus) {
      dropdown.setAttribute('aria-expanded', 'false');
      if (returnFocus) btn.focus();
    }
    function focusItem(i) {
      var all = items();
      if (!all.length) return;
      all[(i + all.length) % all.length].focus();
    }
    function selectedIndex() {
      var all = items();
      for (var i = 0; i < all.length; i++) {
        if (all[i].getAttribute('aria-selected') === 'true') return i;
      }
      return 0;
    }
    function openDropdown(moveFocus) {
      dropdown.setAttribute('aria-expanded', 'true');
      if (moveFocus) focusItem(selectedIndex());
    }
    function choose(item) {
      var lang = item && item.getAttribute('data-lang');
      if (lang && LANG_ORDER.indexOf(lang) !== -1) { applyLang(lang); closeDropdown(true); }
    }

    // e.detail === 0 → activated from the keyboard (Enter / Space)
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isOpen()) closeDropdown(false);
      else openDropdown(e.detail === 0);
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openDropdown(true);
      }
    });
    list.addEventListener('click', function (e) {
      e.stopPropagation();
      choose(e.target.closest('[data-lang]'));
    });
    list.addEventListener('keydown', function (e) {
      var all = items();
      var i = all.indexOf(document.activeElement);
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); focusItem(i + 1); break;
        case 'ArrowUp':   e.preventDefault(); focusItem(i - 1); break;
        case 'Home':      e.preventDefault(); focusItem(0); break;
        case 'End':       e.preventDefault(); focusItem(all.length - 1); break;
        case 'Enter':
        case ' ':         e.preventDefault(); choose(document.activeElement); break;
        case 'Tab':       closeDropdown(false); break;
      }
    });
    document.addEventListener('click', function () { closeDropdown(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) closeDropdown(dropdown.contains(document.activeElement));
    });
  }

  function updateDropdownActive(lang) {
    var btn = document.getElementById('lang-btn');
    if (btn) {
      var cur = btn.querySelector('.lang-current');
      if (cur) cur.textContent = lang.toUpperCase();
    }
    document.querySelectorAll('#lang-list [data-lang]').forEach(function (item) {
      var selected = item.getAttribute('data-lang') === lang;
      item.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  }

  /* ─── burger ─── */

  function initBurger() {
    var burger    = document.querySelector('.burger');
    var mobileNav = document.getElementById('mobile-nav');
    if (!burger || !mobileNav) return;

    function close() {
      burger.setAttribute('aria-expanded', 'false');
      mobileNav.hidden = true;
      document.body.classList.remove('nav-open');
    }
    function open() {
      burger.setAttribute('aria-expanded', 'true');
      mobileNav.hidden = false;
      document.body.classList.add('nav-open');
    }

    burger.addEventListener('click', function () {
      burger.getAttribute('aria-expanded') === 'true' ? close() : open();
    });
    mobileNav.addEventListener('click', function (e) { if (e.target.tagName === 'A') close(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1024) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ─── form ─── */

  function initForm() {
    var form = document.querySelector('.partner-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var lang = document.documentElement.dataset.lang || DEFAULT_LANG;
      var dict = content && content[lang] ? content[lang] : {};
      var msg  = get(dict, 'form.thanks') || 'Thank you — we will be in touch.';
      window.alert(msg);
      form.reset();
    });
  }

  /* ─── partnership: preselect the direction from ?interest= ─── */

  function initInterestFromUrl() {
    var sel = document.getElementById('interest-select');
    if (!sel) return;
    var v = null;
    try { v = new URLSearchParams(window.location.search).get('interest'); } catch (e) {}
    if (!v) return;
    for (var i = 0; i < sel.options.length; i++) {
      var opt = sel.options[i];
      if (opt.value && opt.value === v) {
        opt.defaultSelected = true;   // also survives form.reset()
        sel.value = v;
        return;
      }
    }
  }

  /* ─── fade-in on scroll ─── */

  // Classes are added from JS only, so without JS every block stays visible.
  var REVEAL_SELECTOR = [
    '.hero-inner > *',
    '.section-head > *',
    '.overview-card',
    '.prose', '.gallery-prose', '.gallery-mount', '.split',
    '.stats', '.subsection-title', '.team-card', '.device-card',
    '.partner-form',
    '.story-hero-video', '.story-intro', '.story-photo', '.story-block',
    '.device-tile', '.devices-body',
    '.dl-hero-text > *', '.dl-hero-media', '.dl-head', '.dl-row',
    '.method-card', '.dl-extra-grid', '.dl-trust-inner > *', '.dl-cta-inner > *',
    '.fr-hero-media', '.fr-facts', '.fr-copy > *', '.fr-media', '.fr-stream',
    '.fr-tech', '.fr-proto-photos', '.fr-note', '.fr-benefit', '.fr-list > li',
    '.fr-pack', '.fr-num', '.fr-formats', '.fr-diploma', '.fr-faq',
    '.ne-scene', '.ne-step', '.ne-beats', '.ne-ph', '.ne-panel',
    '.ne-makers-copy > *', '.ne-price-block', '.ne-edition',
    '.ne-gift-copy > *', '.ne-unit-card', '.ne-note'
  ].join(',');
  var revealObserver = null;

  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    } catch (e) {}

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var t = entry.target;
            t.classList.add('visible');
            revealObserver.unobserve(t);
            // drop the stagger once revealed so hover transitions stay instant
            if (t.style.transitionDelay) {
              setTimeout(function () { t.style.transitionDelay = ''; }, 1400);
            }
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    }

    document.querySelectorAll(REVEAL_SELECTOR).forEach(function (el) {
      if (el.classList.contains('fade-in')) return;
      // gentle stagger for siblings in a row (cards, hero lines)
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      var inGrid = /overview-grid|team-grid|device-grid|device-tiles|method-grid|hero-inner|dl-hero-text|dl-trust-inner|dl-cta-inner|section-head|fr-copy|fr-streams|fr-techs|fr-benefits|fr-list|fr-nums|ne-scenes|ne-steps|ne-gallery|ne-cards|ne-panels|ne-makers-copy|ne-gift-copy/.test(el.parentNode.className);
      if (inGrid && i > 0) el.style.transitionDelay = ((i % 4) * 0.09).toFixed(2) + 's';
      el.classList.add('fade-in');
      revealObserver.observe(el);
    });
  }

  /* ─── load + boot ─── */

  function boot(lang) {
    applyLang(lang);
    initInterestFromUrl();
    initDropdown();
    initBurger();
    initForm();
  }

  function loadContent() {
    var lang = detectLang();
    if (typeof fetch !== 'undefined') {
      fetch('./content.json')
        .then(function (r) { return r.json(); })
        .then(function (data) { content = data; boot(lang); })
        .catch(function () { fallbackInline(lang); });
    } else {
      fallbackInline(lang);
    }
  }

  function fallbackInline(lang) {
    var req = new XMLHttpRequest();
    req.open('GET', './content.json', true);
    req.onload = function () {
      if (req.status === 200 || req.status === 0) {
        try { content = JSON.parse(req.responseText); boot(lang); }
        catch (e) { console.error('content.json parse error', e); }
      }
    };
    req.onerror = function () { console.error('Cannot load content.json'); };
    req.send();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    loadContent();
  });
})();
