(() => {
  'use strict';
  const slides = Array.from(document.querySelectorAll('.stage .slide'));
  const stage = document.getElementById('stage');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const counter = document.getElementById('deck-number');
  const title = document.getElementById('deck-title');
  const fill = document.getElementById('progress-fill');
  const overview = document.getElementById('overview');
  const overviewGrid = document.getElementById('overview-grid');
  const overviewButton = document.getElementById('overview-button');
  const closeOverview = document.getElementById('close-overview');
  const fullscreenButton = document.getElementById('fullscreen-button');
  const poster = document.getElementById('poster-final');

  let current = 0;
  let overviewOrigin = overviewButton;
  let pointerStart = null;

  function number(n) {
    return String(n).padStart(2, '0');
  }

  function showSlide(index, updateHash = true) {
    if (!Number.isFinite(index)) return;
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, i) => {
      const selected = i === current;
      slide.classList.toggle('is-current', selected);
      slide.setAttribute('aria-hidden', String(!selected));
    });
    counter.innerHTML = number(current + 1) + ' <span>/</span> ' + number(slides.length);
    title.textContent = slides[current].dataset.title || 'Slide';
    fill.style.width = ((current + 1) / slides.length * 100) + '%';
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    stage.setAttribute('aria-label', 'Slide ' + (current + 1) + ' de ' + slides.length + ': ' + (slides[current].dataset.title || ''));
    overviewGrid.querySelectorAll('button').forEach((button, i) => {
      button.setAttribute('aria-current', String(i === current));
    });
    if (updateHash) history.replaceState(null, '', '#slide-' + number(current + 1));
  }

  function indexFromHash() {
    const match = /^#slide-(\d+)$/.exec(location.hash);
    if (!match) return 0;
    return Math.max(0, Math.min(slides.length - 1, Number(match[1]) - 1));
  }

  function overviewOpen() {
    overviewOrigin = document.activeElement instanceof HTMLElement ? document.activeElement : overviewButton;
    overview.hidden = false;
    document.body.style.overflow = 'hidden';
    const selected = overviewGrid.querySelector('[aria-current="true"]');
    (selected || closeOverview).focus();
  }

  function overviewClose() {
    if (overview.hidden) return;
    overview.hidden = true;
    document.body.style.overflow = '';
    overviewOrigin.focus();
  }

  const thumbDescriptions = [
    'FREE-LAS!', 'MUITAS FORMAS', 'ESTICAR', 'LETRAS / JANELAS',
    'SE ENCONTRAM', 'BORA NOS VER?', 'FORMATOS', 'PAPÉIS',
    'EU SOU FREE-LA', 'CONHEÇA →', '26—12', 'DECISÕES', 'BORA?'
  ];

  slides.forEach((slide, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    const thumb = document.createElement('span');
    thumb.className = 'thumb';
    thumb.textContent = thumbDescriptions[i] || slide.dataset.title;
    const name = document.createElement('span');
    name.className = 'thumb-name';
    name.textContent = number(i + 1) + ' / ' + (slide.dataset.title || 'Slide');
    button.append(thumb, name);
    button.setAttribute('aria-label', 'Ir para o slide ' + (i + 1) + ': ' + slide.dataset.title);
    button.addEventListener('click', () => {
      showSlide(i);
      overviewClose();
    });
    overviewGrid.appendChild(button);
  });

  prev.addEventListener('click', () => showSlide(current - 1));
  next.addEventListener('click', () => showSlide(current + 1));
  overviewButton.addEventListener('click', overviewOpen);
  closeOverview.addEventListener('click', overviewClose);
  overview.addEventListener('click', (event) => {
    if (event.target === overview) overviewClose();
  });

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn('Tela cheia não foi autorizada neste navegador.', error);
    }
  }

  fullscreenButton.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => {
    const on = Boolean(document.fullscreenElement);
    fullscreenButton.setAttribute('aria-label', on ? 'Sair da tela cheia' : 'Entrar em tela cheia');
    fullscreenButton.setAttribute('title', on ? 'Sair (F)' : 'Tela cheia (F)');
  });

  document.addEventListener('keydown', (event) => {
    const element = document.activeElement;
    const editing = element && (
      element.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName)
    );
    if (editing || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape' && !overview.hidden) {
      event.preventDefault();
      overviewClose();
      return;
    }
    if (!overview.hidden) return;
    const key = event.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(key) || (key === ' ' && !event.shiftKey)) {
      event.preventDefault();
      showSlide(current + 1);
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(key) || (key === ' ' && event.shiftKey)) {
      event.preventDefault();
      showSlide(current - 1);
    } else if (key === 'Home') {
      event.preventDefault();
      showSlide(0);
    } else if (key === 'End') {
      event.preventDefault();
      showSlide(slides.length - 1);
    } else if (key.toLowerCase() === 'o') {
      event.preventDefault();
      overviewOpen();
    } else if (key.toLowerCase() === 'f') {
      event.preventDefault();
      toggleFullscreen();
    }
  });

  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') return;
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  stage.addEventListener('pointerup', (event) => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      showSlide(current + (dx < 0 ? 1 : -1));
    }
  });
  stage.addEventListener('pointercancel', () => { pointerStart = null; });

  window.addEventListener('hashchange', () => showSlide(indexFromHash(), false));

  if (poster) {
    function showPosterIfFound() {
      if (poster.naturalWidth > 0) {
        poster.hidden = false;
        const preview = document.getElementById('poster-preview');
        if (preview) preview.hidden = true;
      }
    }
    poster.addEventListener('load', showPosterIfFound);
    poster.addEventListener('error', () => { poster.hidden = true; });
    if (poster.complete) showPosterIfFound();
  }

  showSlide(indexFromHash(), false);
})();