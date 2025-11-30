// js/main.js – CLEAN & FIXED VERSION
let lastClickedPad = null;

function goToPad(padName, palType = "pal1") {
    const palNum = palType === "pal2" ? "2" : "1";
    
    localStorage.setItem('lastClickedPad', padName);
    localStorage.setItem('lastClickedTime', Date.now());
    highlightPad(padName);

    window.location.href = `pad.html?pad=${padName}&pal=${palNum}`;
}

function highlightPad(padName) {
    document.querySelectorAll('.card').forEach(c => c.classList.remove('recently-clicked'));
    const card = document.querySelector(`[data-pad="${padName}"]`);
    if (card) card.classList.add('recently-clicked');
}

function checkAndHighlightLastClicked() {
    const lastPad = localStorage.getItem('lastClickedPad');
    const lastTime = localStorage.getItem('lastClickedTime');
    if (lastPad && lastTime && (Date.now() - parseInt(lastTime)) < 10000) {
        highlightPad(lastPad);
    } else {
        localStorage.removeItem('lastClickedPad');
        localStorage.removeItem('lastClickedTime');
    }
}

// Smart storage key (PAL2 starts at PAD17)
function getStorageKey(padName) {
    const padNum = parseInt(padName.replace('PAD', ''), 10);
    const prefix = padNum >= 17 ? 'PAL2_' : '';
    return `${prefix}wellStatus_${padName}`;
}

function updateAllPads() {
    document.querySelectorAll('.card[data-pad]').forEach(card => {
        const padName = card.dataset.pad;
        const statusSpan = card.querySelector('.status');
        const key = getStorageKey(padName);
        const saved = localStorage.getItem(key);

        // If nothing saved, show IDLE
        if (!saved || saved === '{}' || saved === 'null') {
            statusSpan.textContent = 'IDLE';
            statusSpan.className = 'status idle';
            card.style.background = '';
            card.style.border = '';
            return;
        }

        let parsed;
        try {
            parsed = JSON.parse(saved);
        } catch {
            statusSpan.textContent = 'IDLE';
            statusSpan.className = 'status idle';
            return;
        }

        // ⭐ FIX: If parsed object has 0 wells → always IDLE
        if (Object.keys(parsed).length === 0) {
            statusSpan.textContent = 'IDLE';
            statusSpan.className = 'status idle';
            card.style.background = '';
            card.style.border = '';
            return;
        }

        // Determine worst status
        const statuses = Object.values(parsed);
        let worst = 'normal';
        if (statuses.includes('critical')) worst = 'critical';
        else if (statuses.includes('warning')) worst = 'warning';

        statusSpan.textContent = worst.toUpperCase();
        statusSpan.className = `status ${worst}`;

        // Color effects
        card.style.background = worst === 'critical' ? 'rgba(248,113,113,0.3)' :
                                worst === 'warning' ? 'rgba(251,191,36,0.25)' : '';
        card.style.border = worst === 'critical' ? '3px solid #f87171' :
                          worst === 'warning' ? '3px solid #fbbf24' : '';
    });

    checkAndHighlightLastClicked();
}

window.addEventListener('load', updateAllPads);
window.addEventListener('storage', updateAllPads);
window.addEventListener('focus', updateAllPads);
setInterval(updateAllPads, 2000);

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.card').forEach(card => {
        const h2 = card.querySelector('h2');
        const p = card.querySelector('p');
        if (!h2 || !p) return;

        // Check if either H2 or P text overflows → span 2 columns
        if (h2.scrollHeight > h2.clientHeight || p.scrollHeight > p.clientHeight) {
            card.classList.add('wide-card');
        }
    });
});

