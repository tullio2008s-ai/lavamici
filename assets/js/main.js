/* LAVAMICI® — main.js */

// ── CMS Content Loader ──
function get(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

async function loadContent() {
  try {
    const res = await fetch('/_data/content.json');
    if (!res.ok) return;
    const d = await res.json();

    // Testi
    document.querySelectorAll('[data-cms]').forEach(el => {
      const val = get(d, el.dataset.cms);
      if (val) el.textContent = val;
    });

    // Immagini src
    document.querySelectorAll('[data-cms-src]').forEach(el => {
      const val = get(d, el.dataset.cmsSrc);
      if (val) el.src = val;
    });

    // Link telefono
    if (d.contatti?.telefono_display) {
      document.querySelectorAll('[data-cms-tel]').forEach(el => {
        el.textContent = d.contatti.telefono_display;
        el.href = 'tel:' + d.contatti.telefono_href;
      });
    }

    // Link WhatsApp
    if (d.contatti?.whatsapp_numero) {
      const waUrl = `https://wa.me/${d.contatti.whatsapp_numero}?text=${encodeURIComponent('Salve, vorrei informazioni sui kit LAVAMICI®')}`;
      document.querySelectorAll('[data-cms-wa]').forEach(el => el.href = waUrl);
      const floatBtn = document.getElementById('whatsapp-float');
      if (floatBtn) floatBtn.href = waUrl;
    }

    // Chiave Web3Forms
    if (d.contatti?.web3forms_key) {
      const keyInput = document.getElementById('web3forms-key');
      if (keyInput) keyInput.value = d.contatti.web3forms_key;
    }

  } catch (e) {
    // Fail silently — il contenuto HTML statico rimane visibile
  }
}
loadContent();

// ── Header scroll effect ──
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── Mobile menu ──
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
  });
});

// ── Scroll-to-top button ──
const scrollTopBtn = document.getElementById('scroll-top');
window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });
scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Fade-in on scroll ──
const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
fadeEls.forEach(el => observer.observe(el));

// ── Privacy Modal ──
const modal    = document.getElementById('privacy-modal');
const openModal  = () => modal.classList.add('open');
const closeModal = () => modal.classList.remove('open');

['privacy-link', 'privacy-footer'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', e => { e.preventDefault(); openModal(); });
});
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-close-btn').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Cookie banner ──
function closeCookie(choice) {
  document.getElementById('cookie-banner').classList.remove('show');
  localStorage.setItem('lm_cookie', choice);
}
if (!localStorage.getItem('lm_cookie')) {
  setTimeout(() => document.getElementById('cookie-banner').classList.add('show'), 1200);
}

// ── Contact form — Web3Forms ──
const form    = document.getElementById('contact-form');
const success = document.getElementById('form-success');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Invio in corso…';

  const key = document.getElementById('web3forms-key')?.value || '';

  const payload = {
    access_key: key,
    subject: 'Nuova richiesta LAVAMICI® da ' + form.nome.value,
    nome:      form.nome.value,
    telefono:  form.telefono.value,
    email:     form.email.value,
    interesse: form.interesse.value,
    messaggio: form.messaggio.value,
    botcheck:  '',
  };

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      form.style.display = 'none';
      success.style.display = 'block';
    } else {
      throw new Error(json.message);
    }
  } catch {
    // Fallback WhatsApp
    const wa = document.getElementById('whatsapp-float')?.href
      || 'https://wa.me/393400069549';
    const msg = `${form.nome.value} - ${form.telefono.value}\n${form.messaggio.value}`;
    window.open(wa.split('?')[0] + '?text=' + encodeURIComponent(msg), '_blank');
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Invia richiesta`;
  }
});

// ── Active nav link on scroll ──
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.style.color = '');
      const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (active) active.style.color = 'var(--blue)';
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => navObserver.observe(s));
