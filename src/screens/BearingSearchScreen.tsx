import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Home, RotateCcw, Search } from 'lucide-react';
import SideNav from '../components/SideNav';
import { useSettings } from '../context/SettingsContext';

const CATALOG_URL = 'https://size.name/en/catalog/podshipnik';

// CSS injected into the webview's inner document via executeJavaScript.
// Uses `html body` prefix on key rules to beat Bootstrap's specificity.
const buildInjectCSS = (dark: boolean) => {
  const bg        = dark ? '#0f1117' : '#f1f5f9';
  const surface   = dark ? '#161929' : '#ffffff';
  const surface2  = dark ? '#1e2130' : '#f8fafc';
  const border    = dark ? '#2d3148' : '#dde3ee';
  const text      = dark ? '#cbd5e1' : '#1e293b';
  const textMuted = dark ? '#64748b' : '#64748b';
  const accent    = dark ? '#60a5fa' : '#3b82f6';
  const accentHov = dark ? '#93c5fd' : '#2563eb';
  const danger    = dark ? '#f87171' : '#ef4444';

  return `
  /* 1 ── HIDE SITE CHROME ──────────────────────────────────── */
  header, .header, .site-header, .page-header,
  nav, .navbar, .navbar-expand, .navbar-dark, .navbar-light,
  .navigation, .main-nav, .top-nav, .top-bar, .topbar,
  .breadcrumb, .breadcrumbs,
  footer, .footer, .site-footer, .page-footer,
  .cookie-banner, .cookie-bar, .cookie-notice, .gdpr-banner,
  .popup-overlay, .modal-backdrop,
  .ads, .ad, .advertisement { display: none !important; }

  /* 2 ── BS5 CSS CUSTOM PROPERTIES ───────────────────────────
     Override Bootstrap design tokens before any component CSS runs  */
  :root {
    --bs-body-bg:                    ${bg}        !important;
    --bs-body-color:                 ${text}      !important;
    --bs-secondary-color:            ${textMuted} !important;
    --bs-border-color:               ${border}    !important;
    --bs-border-color-translucent:   ${border}    !important;
    --bs-link-color:                 ${accent}    !important;
    --bs-link-hover-color:           ${accentHov} !important;
    --bs-link-decoration:            none         !important;

    --bs-table-bg:                   transparent  !important;
    --bs-table-color:                ${text}      !important;
    --bs-table-border-color:         ${border}    !important;
    --bs-table-striped-bg:           ${surface2}  !important;
    --bs-table-striped-color:        ${text}      !important;
    --bs-table-hover-bg:             ${accent}1a  !important;
    --bs-table-hover-color:          ${text}      !important;
    --bs-table-active-bg:            ${accent}26  !important;
    --bs-table-accent-bg:            transparent  !important;

    --bs-card-bg:                    ${surface}   !important;
    --bs-card-border-color:          ${border}    !important;
    --bs-card-cap-bg:                ${surface2}  !important;
    --bs-btn-bg:                     ${surface2}  !important;
    --bs-btn-color:                  ${text}      !important;
    --bs-btn-border-color:           ${border}    !important;
    --bs-btn-hover-bg:               ${border}    !important;
    --bs-btn-hover-border-color:     ${accent}    !important;
    --bs-btn-hover-color:            ${text}      !important;
    --bs-input-bg:                   ${surface2}  !important;
    --bs-input-color:                ${text}      !important;
    --bs-input-border-color:         ${border}    !important;
    --bs-input-focus-border-color:   ${accent}    !important;
    --bs-input-focus-box-shadow:     0 0 0 .2rem ${accent}33 !important;
    --bs-input-placeholder-color:    ${textMuted} !important;
    --bs-dropdown-bg:                ${surface}   !important;
    --bs-dropdown-color:             ${text}      !important;
    --bs-dropdown-border-color:      ${border}    !important;
    --bs-dropdown-link-color:        ${text}      !important;
    --bs-dropdown-link-hover-bg:     ${surface2}  !important;
    --bs-list-group-bg:              ${surface}   !important;
    --bs-list-group-color:           ${text}      !important;
    --bs-list-group-border-color:    ${border}    !important;
    --bs-pagination-bg:              ${surface2}  !important;
    --bs-pagination-color:           ${text}      !important;
    --bs-pagination-border-color:    ${border}    !important;
    --bs-pagination-hover-bg:        ${border}    !important;
    --bs-pagination-active-bg:       ${accent}    !important;
    --bs-pagination-active-border-color: ${accent} !important;
  }

  /* 3 ── BASE ─────────────────────────────────────────────── */
  html, body {
    margin: 0 !important; padding: 0 !important;
    background-color: ${bg} !important; color: ${text} !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 13px !important; line-height: 1.55 !important;
  }
  html body * { color: inherit; }
  html body h1,html body h2,html body h3,
  html body h4,html body h5,html body h6 { color: ${text} !important; font-weight: 600 !important; }
  html body h1 { font-size: 20px !important; }
  html body h2 { font-size: 17px !important; }
  html body h3,html body h4,html body h5,html body h6 { font-size: 13px !important; }
  html body p, html body li, html body span,
  html body label, html body small, html body dt, html body dd { color: ${text} !important; }
  html body .text-muted, html body .text-secondary,
  html body .text-body-secondary { color: ${textMuted} !important; }
  html body .text-dark, html body .text-body { color: ${text} !important; }
  html body a { color: ${accent} !important; text-decoration: none !important; }
  html body a:hover { color: ${accentHov} !important; text-decoration: underline !important; }
  html body hr { border-color: ${border} !important; opacity: 1 !important; }

  /* 4 ── LAYOUT CONTAINERS ────────────────────────────────── */
  html body .container, html body .container-fluid,
  html body .container-sm, html body .container-md,
  html body .container-lg, html body .container-xl,
  html body .wrapper, html body .page-wrapper,
  html body main, html body .main, html body .content {
    max-width: 100% !important;
    background-color: transparent !important;
  }

  /* 5 ── BACKGROUNDS ──────────────────────────────────────── */
  html body .bg-white, html body .bg-light,
  html body .bg-body, html body .bg-secondary { background-color: ${surface}  !important; color: ${text} !important; }
  html body .bg-dark,  html body .bg-black    { background-color: ${surface2} !important; color: ${text} !important; }
  html body .bg-primary                       { background-color: ${accent}   !important; color: #fff       !important; }
  html body .bg-transparent                   { background-color: transparent !important; }
  /* ── The missing contextual colours that cause teal/yellow/green sections ── */
  html body .bg-info,    html body .text-bg-info    { background-color: ${surface2} !important; color: ${text} !important; }
  html body .bg-warning, html body .text-bg-warning { background-color: ${surface}  !important; color: ${text} !important; }
  html body .bg-success, html body .text-bg-success { background-color: ${surface}  !important; color: ${text} !important; }
  html body .bg-danger,  html body .text-bg-danger  { background-color: ${surface}  !important; color: ${text} !important; }
  /* ── Clear section / article / jumbotron backgrounds ───── */
  html body section, html body article,
  html body .jumbotron, html body .well,
  html body .section, html body .page-section { background-color: transparent !important; }

  /* 6 ── BORDERS ──────────────────────────────────────────── */
  html body .border,
  html body .border-top, html body .border-end,
  html body .border-bottom, html body .border-start { border-color: ${border} !important; }
  html body .border-0 { border: 0 !important; }

  /* 7 ── INPUTS & FORMS ───────────────────────────────────── */
  html body input, html body input[type="text"],
  html body input[type="search"], html body input[type="number"],
  html body input[type="email"], html body input[type="password"],
  html body select, html body textarea,
  html body .form-control, html body .form-select {
    background-color: ${surface2} !important;
    color: ${text} !important;
    border: 1px solid ${border} !important;
    border-radius: 6px !important;
    padding: 6px 10px !important;
    font-size: 13px !important;
    font-family: inherit !important;
    outline: none !important;
    box-shadow: none !important;
    -webkit-appearance: none !important;
    appearance: none !important;
  }
  html body .input-group-text {
    background-color: ${surface2} !important;
    color: ${textMuted} !important;
    border-color: ${border} !important;
  }
  html body input:focus, html body select:focus,
  html body textarea:focus, html body .form-control:focus,
  html body .form-select:focus {
    border-color: ${accent} !important;
    box-shadow: 0 0 0 .2rem ${accent}33 !important;
    background-color: ${surface2} !important;
    color: ${text} !important;
  }
  html body input::placeholder,
  html body textarea::placeholder { color: ${textMuted} !important; opacity: 1 !important; }
  html body label, html body .form-label { color: ${text} !important; }

  /* 8 ── BUTTONS ──────────────────────────────────────────── */
  html body button, html body input[type="submit"],
  html body input[type="button"], html body .btn, html body a.btn {
    background-color: ${surface2} !important;
    color: ${text} !important;
    border: 1px solid ${border} !important;
    border-radius: 6px !important;
    padding: 5px 14px !important;
    font-size: 12px !important;
    font-family: inherit !important;
    cursor: pointer !important;
    text-decoration: none !important;
    box-shadow: none !important;
  }
  html body button:hover, html body .btn:hover, html body a.btn:hover {
    background-color: ${border} !important;
    border-color: ${accent} !important;
    color: ${text} !important;
  }
  html body .btn-primary { background-color: ${accent} !important; border-color: ${accent} !important; color: #fff !important; }
  html body .btn-primary:hover { background-color: ${accentHov} !important; }
  html body .btn-outline-primary { background: transparent !important; border-color: ${accent} !important; color: ${accent} !important; }
  html body .btn-outline-primary:hover { background-color: ${accent} !important; color: #fff !important; }
  html body .btn-link { background: transparent !important; border: none !important; color: ${accent} !important; }
  html body .btn-danger, html body .btn-outline-danger { border-color: ${danger} !important; color: ${danger} !important; }
  html body .btn-sm { padding: 3px 10px !important; font-size: 11px !important; }
  html body .btn-lg { padding: 8px 18px !important; font-size: 14px !important; }

  /* 9 ── TABLES ───────────────────────────────────────────── */
  html body table, html body .table {
    border-collapse: collapse !important;
    width: 100% !important;
    color: ${text} !important;
    background-color: transparent !important;
  }
  /* BS5 deep cell selector — must beat .table > :not(caption) > * > * */
  html body .table > :not(caption) > * > * {
    background-color: transparent !important;
    color: ${text} !important;
    border-bottom-color: ${border} !important;
    border-color: ${border} !important;
    box-shadow: none !important;
  }
  html body thead, html body thead tr,
  html body .table thead th, html body .table thead td,
  html body .table > thead > tr > th, html body .table > thead > tr > td {
    background-color: ${surface} !important;
    color: ${textMuted} !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
    border-bottom: 2px solid ${border} !important;
    border-color: ${border} !important;
  }
  html body th, html body td,
  html body .table th, html body .table td,
  html body .table > * > tr > th,
  html body .table > * > tr > td {
    border: 1px solid ${border} !important;
    padding: 8px 12px !important;
    color: ${text} !important;
    background-color: transparent !important;
  }
  /* BS4 bordered */
  html body .table-bordered,
  html body .table-bordered th,
  html body .table-bordered td,
  html body .table-bordered > :not(caption) > * > * {
    border: 1px solid ${border} !important;
  }
  /* Striped */
  html body .table-striped > tbody > tr:nth-of-type(odd) > *,
  html body .table-striped tbody tr:nth-child(odd) td {
    background-color: ${surface2}cc !important; color: ${text} !important;
  }
  html body .table-striped > tbody > tr:nth-of-type(even) > *,
  html body .table-striped tbody tr:nth-child(even) td { background-color: transparent !important; }
  /* Hover */
  html body .table-hover > tbody > tr:hover > *,
  html body .table-hover tbody tr:hover td {
    background-color: ${accent}1a !important; color: ${text} !important;
  }
  /* Dark/light table variants */
  html body .table-dark, html body .table-dark th, html body .table-dark td {
    background-color: ${surface} !important; border-color: ${border} !important; color: ${text} !important;
  }
  html body .table-light, html body .table-light th, html body .table-light td {
    background-color: ${surface2} !important; color: ${text} !important; border-color: ${border} !important;
  }
  html body tbody tr { background-color: transparent !important; }
  html body tbody tr:nth-child(even) td { background-color: ${surface2}80 !important; }
  html body tbody tr:hover td { background-color: ${accent}1a !important; }

  /* 10 ── CARDS ───────────────────────────────────────────── */
  html body .card {
    background-color: ${surface} !important; border: 1px solid ${border} !important;
    border-radius: 8px !important; color: ${text} !important; box-shadow: none !important;
  }
  html body .card-header, html body .card-footer {
    background-color: ${surface2} !important; border-color: ${border} !important; color: ${text} !important;
  }
  html body .card-body, html body .card-title,
  html body .card-text, html body .card-subtitle { color: ${text} !important; background-color: transparent !important; }

  /* 11 ── LIST GROUP ──────────────────────────────────────── */
  html body .list-group-item {
    background-color: ${surface} !important; border-color: ${border} !important; color: ${text} !important;
  }
  html body .list-group-item:hover { background-color: ${surface2} !important; }
  html body .list-group-item.active { background-color: ${accent} !important; border-color: ${accent} !important; color: #fff !important; }

  /* 12 ── DROPDOWNS ──────────────────────────────────────── */
  html body .dropdown-menu {
    background-color: ${surface} !important; border: 1px solid ${border} !important;
    border-radius: 8px !important; box-shadow: 0 4px 16px #0006 !important;
  }
  html body .dropdown-item { color: ${text} !important; background-color: transparent !important; }
  html body .dropdown-item:hover, html body .dropdown-item:focus { background-color: ${surface2} !important; }
  html body .dropdown-divider { border-color: ${border} !important; }

  /* 13 ── PAGINATION ─────────────────────────────────────── */
  html body .page-link { background-color: ${surface2} !important; border-color: ${border} !important; color: ${text} !important; }
  html body .page-link:hover { background-color: ${border} !important; }
  html body .page-item.active .page-link { background-color: ${accent} !important; border-color: ${accent} !important; color: #fff !important; }
  html body .page-item.disabled .page-link { color: ${textMuted} !important; }

  /* 14 ── BADGES & ALERTS ────────────────────────────────── */
  html body .badge.bg-primary   { background-color: ${accent}   !important; color: #fff !important; }
  html body .badge.bg-secondary { background-color: ${surface2} !important; color: ${text} !important; border: 1px solid ${border} !important; }
  html body .badge.bg-success   { background-color: #166534 !important; color: #bbf7d0 !important; }
  html body .badge.bg-danger    { background-color: #7f1d1d !important; color: #fecaca !important; }
  /* All alert variants → consistent surface */
  html body .alert                { background-color: ${surface}  !important; border: 1px solid ${border}    !important; border-radius: 8px !important; color: ${text} !important; }
  html body .alert-primary        { background-color: ${surface}  !important; border-color: ${accent}44     !important; color: ${text} !important; }
  html body .alert-secondary      { background-color: ${surface2} !important; border-color: ${border}       !important; color: ${text} !important; }
  html body .alert-info           { background-color: ${surface2} !important; border-color: ${accent}44     !important; color: ${text} !important; }
  html body .alert-warning        { background-color: ${surface}  !important; border-color: ${border}       !important; color: ${text} !important; }
  html body .alert-success        { background-color: ${surface}  !important; border-color: ${border}       !important; color: ${text} !important; }
  html body .alert-danger         { background-color: ${surface}  !important; border-color: ${danger}44     !important; color: ${text} !important; }
  html body .alert-light          { background-color: ${surface2} !important; border-color: ${border}       !important; color: ${text} !important; }
  html body .alert-dark           { background-color: ${surface2} !important; border-color: ${border}       !important; color: ${text} !important; }
  html body .text-danger          { color: ${danger} !important; }

  /* 15 ── SCROLLBAR ──────────────────────────────────────── */
  * { scrollbar-width: thin !important; scrollbar-color: ${border} transparent !important; }
  *::-webkit-scrollbar { width: 6px !important; height: 6px !important; }
  *::-webkit-scrollbar-thumb { background: ${border} !important; border-radius: 999px !important; }
  *::-webkit-scrollbar-track { background: transparent !important; }
  `;
};

const BearingSearchScreen: React.FC = () => {
  const webviewRef = useRef<Electron.WebviewTag | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [canGoBack,    setCanGoBack]    = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [wvHeight,     setWvHeight]     = useState(600);
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';

  // ── Pierce the webview's shadow-root to fix the inner <iframe> ──────────────
  // Electron renders webview content inside an <iframe> in a shadow DOM.
  // That iframe may carry flex: 1 1 0 sizing that prevents it from filling
  // the viewport. We reach it directly and force height: 100vh.
  const fixShadowIframe = useCallback(() => {
    const wv = webviewRef.current as any;
    if (!wv?.shadowRoot) return;
    const iframe: HTMLIFrameElement | null = wv.shadowRoot.querySelector('iframe');
    if (iframe) {
      iframe.style.setProperty('width',   '100%',  'important');
      iframe.style.setProperty('height',  '100vh', 'important');
      iframe.style.setProperty('border',  'none',  'important');
      iframe.style.setProperty('display', 'block', 'important');
      iframe.style.setProperty('flex',    'unset', 'important');
    }
  }, []);

  // ── Measure toolbar → set explicit pixel height on webview element ──────────
  useLayoutEffect(() => {
    const update = () => {
      if (toolbarRef.current) {
        setWvHeight(window.innerHeight - toolbarRef.current.offsetHeight);
      }
      fixShadowIframe();
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [fixShadowIframe]);

  // ── Inject CSS + strip ALL light backgrounds via computed-style scan ─────────
  // CSS !important can't always override site-specific class selectors.
  // We scan every block element's *computed* background (not just [style])
  // and force it transparent via inline style with !important.
  const injectStyles = useCallback((wv: Electron.WebviewTag) => {
    const css = buildInjectCSS(isDark);
    wv.executeJavaScript(`
      (function() {
        /* 1 — Persistent style tag */
        const id = '__dk_theme__';
        let el = document.getElementById(id);
        if (!el) {
          el = document.createElement('style');
          el.id = id;
          document.head.appendChild(el);
        }
        el.textContent = ${JSON.stringify(css)};

        /* 2 — Computed-style scan: strips light backgrounds from ANY element
               regardless of whether it uses inline styles or a CSS class.
               This catches site-specific classes (teal info section, yellow
               results bar, etc.) that our Bootstrap overrides can't beat. */
        var SKIP_TAGS = new Set([
          'TABLE','THEAD','TBODY','TFOOT','TR','TH','TD',
          'IMG','CANVAS','VIDEO','AUDIO','SVG','INPUT',
          'SELECT','TEXTAREA','BUTTON','A'
        ]);
        var SKIP_CLASS = [
          'card','table','btn','form-control','form-select','input-group',
          'modal','dropdown','menu','badge','pagination','page-link',
          'list-group','progress','toast','tooltip','popover',
          'spinner','logo','icon','nav-link','navbar'
        ];

        function hasSkipClass(node) {
          var cls = node.className;
          if (typeof cls !== 'string') return false;
          for (var i = 0; i < SKIP_CLASS.length; i++) {
            if (cls.indexOf(SKIP_CLASS[i]) !== -1) return true;
          }
          return false;
        }

        function stripIfLight(node) {
          if (SKIP_TAGS.has(node.tagName)) return;
          if (hasSkipClass(node)) return;
          var bg = window.getComputedStyle(node).backgroundColor;
          /* rgba(0,0,0,0) = fully transparent → skip */
          if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;
          var m = bg.match(/\\d+(\\.\\d+)?/g);
          if (!m || m.length < 3) return;
          var lum = (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]) / 255;
          if (lum > 0.18) {
            node.style.setProperty('background-color', 'transparent', 'important');
            node.style.setProperty('background',       'transparent', 'important');
          }
        }

        function scan() {
          document.querySelectorAll('div,section,article,aside,main').forEach(stripIfLight);
        }

        /* Run immediately, then again after dynamic content renders */
        scan();
        setTimeout(scan, 500);
        setTimeout(scan, 1500);
        setTimeout(scan, 3500);

        /* 3 — MutationObserver: re-scan newly added nodes (SPA navigation,
               lazy-loaded content, etc.) */
        if (!window.__dk_obs__) {
          window.__dk_obs__ = new MutationObserver(function(mutations) {
            var dirty = false;
            mutations.forEach(function(m) {
              if (m.addedNodes.length) dirty = true;
            });
            if (dirty) scan();
          });
          window.__dk_obs__.observe(document.body, { childList: true, subtree: true });
        }
      })();
    `).catch(() => {});
  }, [isDark]);

  const updateNavState = useCallback(() => {
    const wv = webviewRef.current;
    if (wv) { setCanGoBack(wv.canGoBack()); setCanGoForward(wv.canGoForward()); }
  }, []);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const onDomReady = () => {
      setLoading(false);
      updateNavState();
      fixShadowIframe();
      injectStyles(wv);
    };
    const onStart    = () => setLoading(true);
    const onNavigate = () => { setLoading(false); updateNavState(); injectStyles(wv); };

    wv.addEventListener('dom-ready',            onDomReady);
    wv.addEventListener('did-start-loading',    onStart);
    wv.addEventListener('did-navigate',         onNavigate);
    wv.addEventListener('did-navigate-in-page', onNavigate);

    return () => {
      wv.removeEventListener('dom-ready',            onDomReady);
      wv.removeEventListener('did-start-loading',    onStart);
      wv.removeEventListener('did-navigate',         onNavigate);
      wv.removeEventListener('did-navigate-in-page', onNavigate);
    };
  }, [isDark, updateNavState, fixShadowIframe, injectStyles]);

  return (
    <div className="app-shell">
      <SideNav />
      <main className="app-main bearing-browser-main">

        {/* ── Toolbar ───────────────────────────────────────── */}
        <div ref={toolbarRef} className="bearing-browser-toolbar">
          <button type="button" className="secondary" onClick={() => webviewRef.current?.goBack()} disabled={!canGoBack} title="Back">
            <ChevronLeft size={15} />
          </button>
          <button type="button" className="secondary" onClick={() => webviewRef.current?.goForward()} disabled={!canGoForward} title="Forward">
            <ChevronRight size={15} />
          </button>
          <button type="button" className="secondary" onClick={() => webviewRef.current?.reload()} title="Reload">
            <RotateCcw size={15} />
          </button>
          <button type="button" className="secondary" onClick={() => webviewRef.current?.loadURL(CATALOG_URL)} title="Home">
            <Home size={15} />
          </button>
          <div className="bearing-browser-urlbar">
            <Search size={12} style={{ flexShrink: 0 }} />
            <span>size.name — Bearing Catalog</span>
            {loading && <span className="bearing-browser-spinner" />}
          </div>
        </div>

        {/* ── Webview ───────────────────────────────────────── */}
        {/* eslint-disable-next-line react/no-unknown-property */}
        <webview
          ref={webviewRef as any}
          src={CATALOG_URL}
          allowpopups
          style={{ width: '100%', height: wvHeight, border: 'none', display: 'block', flexShrink: 0 } as React.CSSProperties}
        />

      </main>
    </div>
  );
};

export default BearingSearchScreen;
