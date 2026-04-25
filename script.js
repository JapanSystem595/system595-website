(function () {
  'use strict';

  var LANG_ORDER = ['en','ja','es','ru','de','uk','fr','hi','pt'];
  var DEFAULT_LANG = 'en';
  var STORAGE_KEY = 'system595.lang';
  var content = null; // populated after fetch

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
    renderGalleries(lang);
    updateDropdownActive(lang);

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
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
      return '<article class="device-card">'
        + '<div class="device-image">'
        + imgHtml
        + '<span class="device-fallback" style="' + (imgSrc ? 'display:none' : '') + '">' + escHtml(d.name) + '</span>'
        + '</div>'
        + '<h4>' + escHtml(d.name) + '</h4>'
        + '<dl>'
        + '<dt>' + escHtml(zLabel) + '</dt><dd>' + escHtml(d.zones) + '</dd>'
        + '<dt>' + escHtml(fLabel) + '</dt><dd>' + escHtml(d.functions) + '</dd>'
        + '</dl>'
        + '</article>';
    }).join('');
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

    function closeDropdown() { dropdown.setAttribute('aria-expanded', 'false'); }
    function openDropdown()  { dropdown.setAttribute('aria-expanded', 'true'); }
    function toggleDropdown() {
      if (dropdown.getAttribute('aria-expanded') === 'true') closeDropdown();
      else openDropdown();
    }

    btn.addEventListener('click', function (e) { e.stopPropagation(); toggleDropdown(); });
    list.addEventListener('click', function (e) {
      var item = e.target.closest('[data-lang]');
      if (!item) return;
      var lang = item.getAttribute('data-lang');
      if (lang && LANG_ORDER.indexOf(lang) !== -1) { applyLang(lang); closeDropdown(); }
    });
    document.addEventListener('click', function () { closeDropdown(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDropdown(); });
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

  /* ─── load + boot ─── */

  function boot(lang) {
    applyLang(lang);
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

  document.addEventListener('DOMContentLoaded', loadContent);
})();
