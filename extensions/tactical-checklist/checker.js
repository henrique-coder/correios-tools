const inputList = document.getElementById('inputList');
const visualList = document.getElementById('visualList');
const btnConfirm = document.getElementById('btnConfirm');
const btnReset = document.getElementById('btnReset');
const inputScan = document.getElementById('inputScan');
const lblPending = document.getElementById('lblPending');
const lblFound = document.getElementById('lblFound');

let targets = new Map();
let isRunning = false;
let debounce = null;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function beep(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g);
    g.connect(audioCtx.destination);

    if (type === 'hit') {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        g.gain.setValueAtTime(0.1, audioCtx.currentTime);
        g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    }
}

function updateCounts() {
    let p = 0, f = 0;
    targets.forEach(v => v ? f++ : p++);
    lblPending.textContent = p;
    lblFound.textContent = f;
}

function createListItem(code) {
    const div = document.createElement('div');
    div.className = 'item';
    div.id = `item-${code}`;
    div.innerHTML = `<span>${code}</span> <span id="icon-${code}">❌</span>`;
    return div;
}

btnConfirm.addEventListener('click', () => {
    const raw = inputList.value.trim().toUpperCase().split('\n');
    targets.clear();
    visualList.innerHTML = '';

    let count = 0;
    raw.forEach(line => {
        const code = line.trim();
        if(code) {
            targets.set(code, false);
            visualList.appendChild(createListItem(code));
            count++;
        }
    });

    if(count === 0) return;

    inputList.style.display = 'none';
    visualList.style.display = 'block';
    btnConfirm.style.display = 'none';
    btnReset.style.display = 'inline-block';

    inputScan.disabled = false;
    inputScan.placeholder = "PODE BIPAR AGORA...";
    inputScan.focus();
    isRunning = true;
    updateCounts();
});

btnReset.addEventListener('click', () => {
    isRunning = false;
    inputList.style.display = 'block';
    visualList.style.display = 'none';
    btnConfirm.style.display = 'block';
    btnReset.style.display = 'none';
    inputScan.disabled = true;
    inputScan.value = '';
    inputScan.placeholder = "Aguardando confirmação...";
    targets.clear();
    updateCounts();
});

inputScan.addEventListener('input', () => {
    if(!isRunning) return;
    clearTimeout(debounce);
    debounce = setTimeout(processScanner, 200);
});

inputScan.addEventListener('blur', () => {
    if(isRunning) {
        setTimeout(() => inputScan.focus(), 100);
    }
});

function processScanner() {
    const txt = inputScan.value.toUpperCase();
    const lines = txt.split('\n');
    let hit = false;

    lines.forEach(l => {
        const code = l.trim();
        if(code && targets.has(code) && !targets.get(code)) {
            targets.set(code, true);
            markFound(code);
            hit = true;
        }
    });

    if(hit) {
        inputScan.classList.add('flash-green');
        setTimeout(() => inputScan.classList.remove('flash-green'), 300);
        beep('hit');
    }

    updateCounts();
}

function markFound(code) {
    const el = document.getElementById(`item-${code}`);
    const icon = document.getElementById(`icon-${code}`);
    if(el) {
        el.classList.remove('item');
        void el.offsetWidth;
        el.className = 'item found focus-pop';
        icon.textContent = '✅';

        el.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}
