/* ══════════════════════════════════════════════
   VERSION TIME MACHINE — App Logic
══════════════════════════════════════════════ */

/* ── THEME TOGGLE ───────────────────────────── */
const Theme = (() => {
    const html   = document.documentElement;
    const btn    = document.getElementById('themeToggle');
    const KEY    = 'vtm-theme';

    const ICONS  = { dark: '☀️', light: '🌙' };
    const LABELS = { dark: 'Switch to light mode', light: 'Switch to dark mode' };

    function apply(mode) {
        html.classList.toggle('light', mode === 'light');
        btn.textContent = ICONS[mode];
        btn.setAttribute('aria-label', LABELS[mode]);
        btn.title = LABELS[mode];
        localStorage.setItem(KEY, mode);
    }

    function toggle() {
        apply(html.classList.contains('light') ? 'dark' : 'light');
    }

    // Init: respect saved preference, then OS preference
    function init() {
        const saved = localStorage.getItem(KEY);
        if (saved) {
            apply(saved);
        } else if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
            apply('light');
        } else {
            apply('dark'); // explicit call so icon is set correctly
        }
    }

    btn.addEventListener('click', toggle);
    return { init };
})();


/* ── SPA NAVIGATION ─────────────────────────── */
const App = (() => {
    const views   = document.querySelectorAll('.view');
    const navTabs = document.querySelectorAll('.nav-tab');

    function show(viewId) {
        views.forEach(v   => v.classList.toggle('active', v.id === `view-${viewId}`));
        navTabs.forEach(t => t.classList.toggle('active', t.dataset.view === viewId));
    }

    navTabs.forEach(tab => tab.addEventListener('click', () => show(tab.dataset.view)));
    return { show };
})();

window.showView = App.show;


/* ── SECTION TOGGLE ─────────────────────────── */
function toggleSection(header) {
    const body = header.nextElementSibling;
    header.classList.toggle('open');
    body.classList.toggle('open');
}


/* ── LINK CATEGORY TOGGLE ────────────────────── */
function toggleCategory(header) {
    const body = header.nextElementSibling;
    header.classList.toggle('open');
    body.classList.toggle('open');
}


/* ── VENDOR LINK FILTER ──────────────────────── */
function filterLinks(query) {
    const q = query.trim().toLowerCase();
    document.querySelectorAll('.link-category').forEach(cat => {
        let visible = 0;
        cat.querySelectorAll('.vendor-card').forEach(v => {
            const match = !q || v.textContent.toLowerCase().includes(q);
            v.classList.toggle('hidden', !match);
            if (match) visible++;
        });
        cat.classList.toggle('hidden', visible === 0 && q.length > 0);
    });
}


/* ── GROUP ICONS ─────────────────────────────── */
const GROUP_ICONS = {
    browsers: '🌏',
    macos:    '💻',
    ios:      '📱',
    ipados:   '🍎',
    esxi:     '🖥',
    m365:     '📊',
    dotnet:   '⚙️',
};


/* ── DATE FORMATTER ─────────────────────────── */
function formatDate(dateStr) {
    if (!dateStr || dateStr === '—') return '—';
    const d   = new Date(dateStr);
    const day = d.getUTCDate();
    const mn  = ["January","February","March","April","May","June",
                 "July","August","September","October","November","December"];
    const sfx = n => {
        if (n > 3 && n < 21) return 'th';
        return ['th','st','nd','rd','th','th','th','th','th','th'][n % 10] ?? 'th';
    };
    return `${day}${sfx(day)} ${mn[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}


/* ── RENDER ONE VERSION CARD ─────────────────── */
function renderCard(platform, data, selectedDate) {
    const { safe, fresh, latestDays } = data;
    const card = document.createElement('div');
    card.className = 'card';

    // Check if this platform is EOL as of the selected date
    const isEol = platform.eol && new Date(selectedDate) >= new Date(platform.eol);
    if (isEol) card.classList.add('card--eol');

    if (safe.v === 'Not released yet') {
        card.innerHTML = `
            <div class="card-name">${platform.name}</div>
            <div class="card-version-block">
                <div class="card-version-label">Safe version</div>
                <div class="not-released">Not released yet</div>
            </div>`;
        return card;
    }

    const isFuture = platform.key.includes('26');

    if (isEol) {
        card.innerHTML = `
            <div class="card-name">${platform.name}</div>
            <div class="card-eol-banner">
                <span class="card-eol-icon">⚠</span>
                <div>
                    <div class="card-eol-title">End of Life</div>
                    <div class="card-eol-date">Support ended ${formatDate(platform.eol)} — no further security patches</div>
                </div>
            </div>`;
        return card;
    }

    card.innerHTML = `
        <div class="card-name">${platform.name}</div>
        <div class="card-version-block">
            <div class="card-version-label">✓ Latest safe version</div>
            <div class="card-version-number">${safe.v}</div>
            <div class="card-version-date">Released ${formatDate(safe.d)}</div>
        </div>
        ${fresh ? `
        <div class="card-fresh-note">
            ⚠ Newer version <strong>${fresh.v}</strong> (${formatDate(fresh.d)}) was only
            ${latestDays} day${latestDays !== 1 ? 's' : ''} old — too fresh to be safe
        </div>` : ''}
        ${isFuture ? `<div class="future-badge">Future OS</div>` : ''}
    `;
    return card;
}


/* ── MAIN: CHECK VERSIONS ────────────────────── */
window.checkVersions = function () {
    const input = document.getElementById('dateInput').value;
    if (!input) { alert('Please pick a date first!'); return; }

    const container = document.getElementById('results');
    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'result-header';
    header.innerHTML = `
        <div class="result-date-pill">
            <span>📅</span> Safe versions as of ${formatDate(input)}
        </div>`;
    container.appendChild(header);

    groups.forEach((group, gi) => {
        const section = document.createElement('div');
        section.className = 'section';
        section.style.animationDelay = `${gi * 60}ms`;

        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        const LABELS = {
            browsers: 'Safe browser versions on',
            macos:    'Safe macOS versions on',
            ios:      'Safe iOS versions on',
            ipados:   'Safe iPadOS versions on',
            esxi:     'Safe VMware ESXi versions on',
            m365:     'Safe Microsoft 365 versions on',
            dotnet:   'Safe .NET versions on',
        };
        const dateLabel = LABELS[group.id] ?? 'Safe versions on';

        sectionHeader.innerHTML = `
            <div class="section-header-left">
                <span class="section-icon">${GROUP_ICONS[group.id] ?? '📦'}</span>
                <div class="section-header-text">
                    <span class="section-title">${group.title}</span>
                    <span class="section-date-label">${dateLabel} ${formatDate(input)}</span>
                </div>
                <span class="section-count">${group.platforms.length}</span>
            </div>
            <span class="section-chevron">▾</span>`;
        sectionHeader.addEventListener('click', () => toggleSection(sectionHeader));

        const sectionBody = document.createElement('div');
        sectionBody.className = 'section-body';

        group.platforms.forEach((platform, pi) => {
            const data = getSafeLatest(releases[platform.key], input);
            const card = renderCard(platform, data, input);
            sectionBody.appendChild(card);
            setTimeout(() => card.classList.add('show'), gi * 60 + pi * 80);
        });

        section.appendChild(sectionHeader);
        section.appendChild(sectionBody);
        container.appendChild(section);

        if (gi === 0) {
            sectionHeader.classList.add('open');
            sectionBody.classList.add('open');
        }
    });
};


/* ── INIT ───────────────────────────────────── */
window.addEventListener('load', () => {
    Theme.init();

    // Open all link categories
    document.querySelectorAll('.lcat-header').forEach(h => {
        h.classList.add('open');
        h.nextElementSibling.classList.add('open');
    });

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateInput').value = today;
    checkVersions();
});