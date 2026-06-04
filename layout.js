(function () {
  'use strict';

  var NAV_ITEMS = [
    { i18n: 'nav.about',       href: 'about.html',       text: 'About' },
    { i18n: 'nav.devices',     href: 'devices.html',     text: 'Devices' },
    { i18n: 'nav.showrooms',   href: 'showrooms.html',   text: 'Showrooms' },
    { i18n: 'nav.studios',     href: 'studios.html',     text: 'Massage Studio Franchise' },
    { i18n: 'nav.moxi',        href: 'moxi.html',        text: 'Moxi Yoga' },
    { i18n: 'nav.software',    href: 'software.html',    text: 'Software + AI' },
    { i18n: 'nav.partnership', href: 'partnership.html', text: 'Partnership' },
  ];

  var page = window.location.pathname.split('/').pop() || 'index.html';

  function navLinks() {
    return NAV_ITEMS.map(function (item) {
      var cls = item.href === page ? ' class="nav-active"' : '';
      return '<a href="' + item.href + '"' + cls + ' data-i18n="' + item.i18n + '">' + item.text + '</a>';
    }).join('');
  }

  var HEADER = [
    '<header class="site-header" id="top">',
      '<div class="container header-inner">',
        '<a href="index.html" class="brand" aria-label="System 5/95 — home">',
          '<img src="images/logo.svg" alt="System 5/95" class="logo-img">',
        '</a>',
        '<nav class="primary-nav" aria-label="Primary">',
          navLinks(),
        '</nav>',
        '<div class="header-controls">',
          '<div class="lang-dropdown" id="lang-dropdown" role="combobox" aria-haspopup="listbox" aria-expanded="false">',
            '<button type="button" class="lang-trigger" aria-label="Language" id="lang-btn">',
              '<span class="lang-current">EN</span>',
              '<svg class="lang-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">',
                '<path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
              '</svg>',
            '</button>',
            '<ul class="lang-list" role="listbox" id="lang-list" aria-label="Select language">',
              '<li role="option" data-lang="en"  aria-selected="false"><span class="lc">EN</span><span class="ln">English</span></li>',
              '<li role="option" data-lang="ja"  aria-selected="false"><span class="lc">JA</span><span class="ln">日本語</span></li>',
              '<li role="option" data-lang="es"  aria-selected="false"><span class="lc">ES</span><span class="ln">Español</span></li>',
              '<li role="option" data-lang="ru"  aria-selected="false"><span class="lc">RU</span><span class="ln">Русский</span></li>',
              '<li role="option" data-lang="de"  aria-selected="false"><span class="lc">DE</span><span class="ln">Deutsch</span></li>',
              '<li role="option" data-lang="uk"  aria-selected="false"><span class="lc">UK</span><span class="ln">Українська</span></li>',
              '<li role="option" data-lang="fr"  aria-selected="false"><span class="lc">FR</span><span class="ln">Français</span></li>',
              '<li role="option" data-lang="hi"  aria-selected="false"><span class="lc">HI</span><span class="ln">हिन्दी</span></li>',
              '<li role="option" data-lang="pt"  aria-selected="false"><span class="lc">PT</span><span class="ln">Português</span></li>',
            '</ul>',
          '</div>',
          '<button type="button" class="burger" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobile-nav">',
            '<span></span><span></span><span></span>',
          '</button>',
        '</div>',
      '</div>',
      '<nav id="mobile-nav" class="mobile-nav" aria-label="Mobile" hidden>',
        navLinks(),
      '</nav>',
    '</header>',
  ].join('');

  var FOOTER = [
    '<footer class="site-footer">',
      '<div class="container footer-inner">',
        '<div class="footer-col">',
          '<div class="brand-name">System&nbsp;5/95</div>',
          '<p class="small" data-i18n="footer.tagline">Japanese-engineered wellness ecosystem.</p>',
        '</div>',
        '<div class="footer-col small" data-i18n="footer.offices">Fujiyoshida, Japan \xb7 United States</div>',
        '<div class="footer-col small"><a href="#" data-i18n="footer.privacy">Privacy Policy</a></div>',
        '<div class="footer-col small" data-i18n="footer.rights">\xa9 2026 System 5/95. All rights reserved.</div>',
      '</div>',
    '</footer>',
  ].join('');

  var hEl = document.getElementById('site-header');
  if (hEl) hEl.outerHTML = HEADER;

  var fEl = document.getElementById('site-footer');
  if (fEl) fEl.outerHTML = FOOTER;
})();
