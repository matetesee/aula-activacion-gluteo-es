// ═══════════════════════════════════════════════════════════════
// BumbumFlix Backredirect — script.js
// ═══════════════════════════════════════════════════════════════

const TIMER_DURATION = 5 * 60; // 5 minutos
const TIMER_KEY = 'bumbumflix_back_ends_at';
const OPENED_KEY = 'bumbumflix_gift_opened';

const body = document.body;
const giftScreen = document.getElementById('gift-screen');
const giftBtn = document.getElementById('gift-btn');
const couponScreen = document.getElementById('coupon-screen');
const ofertaSection = document.getElementById('oferta');
const couponCodeBtn = document.getElementById('coupon-code');
const copyIcon = document.getElementById('copy-icon');
const timerMin = document.getElementById('timer-min');
const timerSec = document.getElementById('timer-sec');
const stickyBar = document.getElementById('sticky-bar');

let timerInterval = null;
let opening = false;

// ═══════════════════════════════════════════════════════════════
// Restaurar el estado anterior (al refrescar la página)
// ═══════════════════════════════════════════════════════════════
(function init() {
  const wasOpened = localStorage.getItem(OPENED_KEY) === '1';
  const stored = localStorage.getItem(TIMER_KEY);

  if (wasOpened && stored) {
    const endsAt = parseInt(stored, 10);
    const remaining = Math.floor((endsAt - Date.now()) / 1000);

    if (remaining > 0) {
      // Restaurar: saltear la pantalla del regalo, mostrar cupón + oferta directo (sin animación)
      revealAll(true);
      startTimer();
      return;
    }
  }

  // Visita nueva O el timer ya expiró — limpia el estado y muestra el regalo
  localStorage.removeItem(TIMER_KEY);
  localStorage.removeItem(OPENED_KEY);
})();

// ═══════════════════════════════════════════════════════════════
// Click en el regalo
// ═══════════════════════════════════════════════════════════════
giftBtn.addEventListener('click', handleGiftClick);

function handleGiftClick() {
  if (opening) return;
  opening = true;

  // Marca que ya abrió el regalo
  localStorage.setItem(OPENED_KEY, '1');

  // ¡Confeti!
  fireConfetti();

  // Anima el regalo saliendo (escala + desaparece)
  giftBtn.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
  giftBtn.style.transform = 'scale(1.4) rotate(15deg)';
  setTimeout(() => {
    giftBtn.style.transform = 'scale(0)';
    giftBtn.style.opacity = '0';
  }, 250);

  // Después de 600ms: oculta la pantalla del regalo y muestra cupón + oferta
  setTimeout(() => {
    revealAll(false);
    startTimer();
  }, 600);

  // Auto-scroll hacia la oferta después de que aparece el cupón
  setTimeout(() => {
    ofertaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 2400);
}

// ═══════════════════════════════════════════════════════════════
// Revelar cupón + oferta
// ═══════════════════════════════════════════════════════════════
function revealAll(instant) {
  body.dataset.state = 'offer';

  // Oculta la pantalla del regalo
  giftScreen.style.display = 'none';

  // Muestra la barra fija arriba + cupón + oferta
  if (stickyBar) stickyBar.hidden = false;
  couponScreen.hidden = false;
  ofertaSection.hidden = false;

  if (instant) {
    couponScreen.style.animation = 'none';
    ofertaSection.style.animation = 'none';
  }
}

// ═══════════════════════════════════════════════════════════════
// Confeti (canvas-confetti)
// ═══════════════════════════════════════════════════════════════
function fireConfetti() {
  if (typeof confetti !== 'function') return;

  const colors = ['#EC4899', '#FCD34D', '#10B981', '#3B82F6', '#FFFFFF'];

  // Explosión central
  confetti({
    particleCount: 100,
    spread: 90,
    origin: { x: 0.5, y: 0.5 },
    colors,
    scalar: 1,
    gravity: 1,
    ticks: 220,
  });

  // Explosiones laterales
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.55 },
      colors,
    });
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.55 },
      colors,
    });
  }, 250);

  // Explosión final
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 130,
      origin: { x: 0.5, y: 0.4 },
      colors,
      startVelocity: 35,
      ticks: 180,
    });
  }, 500);
}

// ═══════════════════════════════════════════════════════════════
// Copiar el código del cupón
// ═══════════════════════════════════════════════════════════════
couponCodeBtn.addEventListener('click', async () => {
  const code = couponCodeBtn.dataset.code || 'BUMBUM50';
  try {
    await navigator.clipboard.writeText(code);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = code;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  couponCodeBtn.classList.add('copied');
  copyIcon.textContent = '✓ ¡copiado!';

  setTimeout(() => {
    couponCodeBtn.classList.remove('copied');
    copyIcon.textContent = '📋 copiar';
  }, 2000);
});

// ═══════════════════════════════════════════════════════════════
// Timer
// ═══════════════════════════════════════════════════════════════
function startTimer() {
  let endsAt;
  const stored = localStorage.getItem(TIMER_KEY);

  if (stored && parseInt(stored, 10) > Date.now()) {
    endsAt = parseInt(stored, 10);
  } else {
    endsAt = Date.now() + TIMER_DURATION * 1000;
    localStorage.setItem(TIMER_KEY, endsAt);
  }

  function tick() {
    const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;

    if (timerMin) timerMin.textContent = String(m).padStart(2, '0');
    if (timerSec) timerSec.textContent = String(s).padStart(2, '0');

    if (remaining <= 60 && stickyBar) {
      stickyBar.classList.add('urgent');
    }

    if (remaining <= 0) {
      clearInterval(timerInterval);
    }
  }

  tick();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(tick, 1000);
}
