(() => {
  'use strict';
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let previousFocus = null;
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  // The Design System's 900px coverflow perspective and relative transforms.
  const valuesFlow = $('[data-values-coverflow]');
  const valuesStage = $('.coverflow-container', valuesFlow);
  const valueCards = $$('[data-value-card]', valuesFlow);
  let activeValue = 1;
  function selectValue(index) {
    activeValue = (index + valueCards.length) % valueCards.length;
    const spacing = innerWidth <= 600 ? 175 : innerWidth <= 850 ? 240 : 290;
    valueCards.forEach((card, i) => {
      const offset = i - activeValue;
      card.classList.toggle('is-active', offset === 0);
      $('.value-select', card).setAttribute('aria-pressed', String(offset === 0));
      card.style.transform = `translateX(${offset * spacing}px) translateZ(${offset === 0 ? 70 : -100}px) rotateY(${offset * -24}deg) scale(${offset === 0 ? 1 : .86})`;
      card.style.zIndex = String(5 - Math.abs(offset));
      card.style.opacity = offset === 0 ? '1' : '.6';
    });
    $('.carousel-position', valuesFlow).textContent = `${String(activeValue + 1).padStart(2, '0')} / ${String(valueCards.length).padStart(2, '0')}`;
  }
  let valueDrag = null;
  let suppressValueClick = false;
  valueCards.forEach((card, i) => {
    $('.value-select', card).addEventListener('click', () => { if (!suppressValueClick) selectValue(i); });
    $('.value-select', card).addEventListener('focus', () => selectValue(i));
    $('img', card).draggable = false;
  });
  $$('[data-value-direction]', valuesFlow).forEach(button => {
    button.addEventListener('click', () => selectValue(activeValue + Number(button.dataset.valueDirection)));
  });
  valuesFlow.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      selectValue(activeValue + (event.key === 'ArrowLeft' ? -1 : 1));
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      selectValue(event.key === 'Home' ? 0 : valueCards.length - 1);
    }
  });
  valuesStage.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    valueDrag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    suppressValueClick = false;
  });
  window.addEventListener('pointerup', event => {
    if (!valueDrag || event.pointerId !== valueDrag.id) return;
    const dx = event.clientX - valueDrag.x;
    const dy = event.clientY - valueDrag.y;
    valueDrag = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      suppressValueClick = true;
      selectValue(activeValue + (dx > 0 ? -1 : 1));
      setTimeout(() => { suppressValueClick = false; }, 0);
    }
  });
  window.addEventListener('pointercancel', () => { valueDrag = null; });
  window.addEventListener('resize', () => selectValue(activeValue));
  valuesFlow.classList.add('is-enhanced');
  selectValue(activeValue);

  // The 3D volume is CSS geometry; only the verified original cover is an image.
  function createBook(book) {
    const scene = el('div', 'book-scene');
    scene.setAttribute('aria-hidden', 'true');
    const object = el('div', 'book-object');
    const front = el('div', 'book-face book-front');
    if (book.cover) {
      const cover = el('div', 'official-cover');
      cover.dataset.coverId = book.id;
      const image = el('img');
      image.src = book.cover;
      image.alt = '';
      image.width = book.geometry.width;
      image.height = book.geometry.height;
      image.loading = 'lazy';
      cover.append(image);
      front.append(cover);
    } else {
      const placeholder = el('div', 'book-placeholder');
      placeholder.append(el('span', '', '+'), el('span', '', 'Capa oficial\na incorporar'), el('span', '', 'Prévia editorial'));
      front.append(placeholder);
    }
    const back = el('div', 'book-face book-back');
    back.append(el('span', '', 'LEITURAS / JAIRO MANHÃES'));
    const spine = el('div', 'book-face book-spine');
    spine.append(el('span', '', 'JAIRO MANHÃES'));
    object.append(front, back, spine, el('div', 'book-face book-pages'), el('div', 'book-face book-top'), el('div', 'book-face book-bottom'));
    scene.append(object);
    return scene;
  }

  $$('.readings[data-book]').forEach(chapter => {
    const book = window.HDS_BOOKS.find(item => item.id === chapter.dataset.book);
    const slot = $('[data-book-slot]', chapter);
    if (!slot || !book) return;
    const caption = el('div', 'book-caption');
    caption.append(el('span', 'mono', 'Leitura para este momento'), el('p', 'book-title', book.title), el('p', '', 'Pastor Jairo Manhães'));
    const link = el('a', '', 'Conheça a leitura ↗');
    link.href = `#livro-${book.id}`;
    caption.append(link);
    slot.append(createBook(book), caption);
  });

  // Projective display correction maps the four original cover corners to the
  // book face. The source image is lossless WebP; no artwork is generated or retyped.
  function projection(corners, width, height) {
    const target = [[0, 0], [width, 0], [width, height], [0, height]];
    const rows = [];
    corners.forEach(([x, y], i) => {
      const [u, v] = target[i];
      rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
      rows.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
    });
    for (let col = 0; col < 8; col++) {
      let pivot = col;
      for (let row = col + 1; row < 8; row++) if (Math.abs(rows[row][col]) > Math.abs(rows[pivot][col])) pivot = row;
      [rows[col], rows[pivot]] = [rows[pivot], rows[col]];
      const divisor = rows[col][col];
      for (let j = col; j <= 8; j++) rows[col][j] /= divisor;
      for (let row = 0; row < 8; row++) {
        if (row === col) continue;
        const factor = rows[row][col];
        for (let j = col; j <= 8; j++) rows[row][j] -= factor * rows[col][j];
      }
    }
    const [a, b, c, d, e, f, g, h] = rows.map(row => row[8]);
    return `matrix3d(${[a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1].join(',')})`;
  }
  const coverResize = new ResizeObserver(entries => entries.forEach(({ target }) => {
    const book = window.HDS_BOOKS.find(item => item.id === target.dataset.coverId);
    const image = $('img', target);
    image.style.width = `${book.geometry.width}px`;
    image.style.height = `${book.geometry.height}px`;
    image.style.transform = projection(book.geometry.corners, target.clientWidth, target.clientHeight);
  }));

  const library = $('[data-book-library]');
  const journeyStage = el('div', 'book-journey-stage');
  journeyStage.setAttribute('aria-hidden', 'true');
  const journeyScene = createBook(window.HDS_BOOKS[0]);
  const journeyObject = $('.book-object', journeyScene);
  const journeyFronts = [$('.book-front', journeyObject)];
  window.HDS_BOOKS.slice(1).forEach(book => {
    const front = $('.book-front', createBook(book));
    front.style.visibility = 'hidden';
    journeyFronts.push(front);
    journeyObject.append(front);
  });
  journeyStage.append(journeyScene);
  library.append(journeyStage);
  window.HDS_BOOKS.forEach((book, index) => {
    const card = el('article', 'library-card');
    card.id = `livro-${book.id}`;
    card.setAttribute('aria-labelledby', `titulo-${book.id}`);
    const title = el('h3', '', book.title);
    title.id = `titulo-${book.id}`;
    const copy = el('div', 'library-copy');
    copy.append(el('span', 'library-theme', `${String(index + 1).padStart(2, '0')} / ${book.theme}`), title, el('span', 'library-author', book.author));
    if (book.preface) copy.append(el('span', 'library-preface', book.preface));
    copy.append(el('p', 'library-description', book.description));
    card.append(createBook(book), copy);
    const action = el(book.url ? 'a' : 'button', 'book-action');
    action.append(el('span', '', 'Conheça o livro'), el('span', '', '↗'));
    if (book.url) {
      action.href = book.url;
      action.target = '_blank';
      action.rel = 'noopener noreferrer';
      action.setAttribute('aria-label', `Conheça o livro ${book.title} na loja oficial (nova aba)`);
    } else {
      action.type = 'button';
      action.setAttribute('aria-label', `Conheça o livro ${book.title}: informações e disponibilidade do link`);
      action.addEventListener('click', () => openBookDialog(book, action));
    }
    copy.append(action, el('p', 'library-status', book.status));
    library.append(card);
  });

  $$('.official-cover').forEach(cover => coverResize.observe(cover));

  const dialog = $('.reading-dialog');
  function openBookDialog(book, trigger) {
    previousFocus = trigger;
    $('#reading-dialog-title').textContent = book.title;
    $('.dialog-copy').textContent = `${book.author}. ${book.preface ? `${book.preface}. ` : ''}${book.description}`;
    $('.dialog-status').textContent = 'A loja oficial está indisponível no endereço conferido. O link para conhecer este livro na loja será ativado após a confirmação do endereço atualizado.';
    dialog.hidden = false;
    document.body.classList.add('no-scroll');
    $('.dialog-close').focus();
  }
  function closeDialog() {
    dialog.hidden = true;
    document.body.classList.remove('no-scroll');
    previousFocus?.focus();
  }
  $('.dialog-close').addEventListener('click', closeDialog);
  $('.dialog-done').addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDialog();
    if (event.key !== 'Tab') return;
    const first = $('.dialog-close');
    const last = $('.dialog-done');
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const menu = $('.main-nav');
  const menuButton = $('.menu-toggle');
  function closeMenu() {
    menu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menu');
  }
  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  $$('a', menu).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); menuButton.focus(); } });
  const navBar = $('.pipwise-nav-floating-bar');
  navBar.addEventListener('pointermove', event => {
    if (paused) return;
    const rect = navBar.getBoundingClientRect();
    navBar.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
    navBar.style.setProperty('--spotlight-opacity', '1');
  });
  navBar.addEventListener('pointerleave', () => navBar.style.setProperty('--spotlight-opacity', '0'));

  if (!paused) document.documentElement.classList.add('js-motion');
  const reveals = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); reveals.unobserve(entry.target); } });
  }, { threshold: 0.08 });
  $$('.reveal').forEach(node => reveals.observe(node));
  const activeSections = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const activeId = entry.target.id;
      $$('.main-nav a').forEach(link => {
        const active = link.hash === `#${activeId}`;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-12% 0px -65% 0px', threshold: 0 });
  $$('.chapter').forEach(node => activeSections.observe(node));

  // Demand-load and keep a bounded set of decoded frames rather than decoding the entire film.
  const film = $('[data-david-scroll]');
  const canvas = $('#david-canvas');
  const context = canvas.getContext('2d', { alpha: false });
  const audio = $('#david-audio');
  const playButton = $('.film-play');
  const soundButton = $('.film-sound');
  const frameCount = 239;
  const duration = frameCount / 24;
  const frames = new Map();
  const loading = new Map();
  const failedFrames = new Set();
  let wantedFrame = 1;
  let lastDrawn = 0;
  let currentProgress = 0;
  let playing = false;
  let sound = false;
  let playbackTime = 0;
  let previousTick = 0;
  let lastStage = -1;
  let playbackRaf = 0;
  let requestRaf = 0;
  let filmNear = false;

  function drawFrame(index) {
    const image = frames.get(index);
    if (!image || !context) return;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    lastDrawn = index;
    $('.film-visual').classList.add('is-ready');
  }
  function trimFrames() {
    if (frames.size <= 22) return;
    [...frames.keys()].sort((a, b) => Math.abs(b - wantedFrame) - Math.abs(a - wantedFrame)).slice(0, frames.size - 22).forEach(index => frames.delete(index));
  }
  function loadFrame(index) {
    if (index < 1 || index > frameCount || failedFrames.has(index)) return Promise.resolve();
    if (frames.has(index)) return Promise.resolve(frames.get(index));
    if (loading.has(index)) return loading.get(index);
    const promise = new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        loading.delete(index);
        frames.set(index, image);
        trimFrames();
        if (wantedFrame === index) drawFrame(index);
        else if (filmNear && !frames.has(wantedFrame) && !loading.has(wantedFrame)) loadFrame(wantedFrame);
        resolve(image);
      };
      image.onerror = () => { loading.delete(index); failedFrames.add(index); resolve(); };
      image.src = `assets/images/davi/frames/davi-${String(index).padStart(4, '0')}.webp`;
    });
    loading.set(index, promise);
    return promise;
  }
  const stages = [
    { label: '01 / O pastor', title: 'Fiel no', accent: 'pouco.', copy: 'O cuidado com o rebanho. A responsabilidade que já estava em suas mãos.' },
    { label: '02 / O harpista', title: 'Formado na', accent: 'presença.', copy: 'A harpa expressa a intimidade com Deus. Uma fé cultivada antes das grandes responsabilidades.' },
    { label: '03 / O rei guerreiro', title: 'Coragem com', accent: 'propósito.', copy: 'Do campo às grandes responsabilidades. Um homem cuja história nos convida à fé, ao compromisso e ao serviço.' }
  ];
  function updateFilm(progress) {
    currentProgress = clamp(progress);
    wantedFrame = Math.round(currentProgress * (frameCount - 1)) + 1;
    $('.film-progress>span').style.transform = `scaleX(${currentProgress})`;
    const stage = currentProgress < 0.32 ? 0 : currentProgress < 0.69 ? 1 : 2;
    if (stage !== lastStage) {
      const data = stages[stage];
      $('[data-david-label]').textContent = data.label;
      $('[data-david-title]').replaceChildren(document.createTextNode(data.title), el('br'), el('span', '', data.accent));
      $('[data-david-copy]').textContent = data.copy;
      $$('[data-film-stage]').forEach((item, index) => item.classList.toggle('is-active', index === stage));
      lastStage = stage;
    }
    if (lastDrawn !== wantedFrame) drawFrame(wantedFrame);
    if (loading.size < 6 || loading.has(wantedFrame)) loadFrame(wantedFrame);
    if (frames.has(wantedFrame) && loading.size < 4) {
      [wantedFrame + 1, wantedFrame + 2, wantedFrame - 1].forEach(loadFrame);
    }
  }
  function stopPlayback() {
    playing = false;
    cancelAnimationFrame(playbackRaf);
    audio.pause();
    playButton.replaceChildren(document.createTextNode('▷ '), el('span', '', currentProgress >= 0.99 ? 'Rever sequência' : 'Reproduzir sequência'));
    playButton.setAttribute('aria-label', 'Reproduzir sequência de Davi');
  }
  function playbackTick(now) {
    if (!playing) return;
    const delta = Math.min((now - previousTick) / 1000, 0.1);
    previousTick = now;
    const next = Math.min(duration, playbackTime + delta);
    const index = Math.round(next / duration * (frameCount - 1)) + 1;
    if (frames.has(index)) playbackTime = sound && !audio.paused ? Math.min(duration, audio.currentTime) : next;
    else { loadFrame(index); if (sound) audio.pause(); }
    updateFilm(playbackTime / duration);
    for (let offset = 1; offset <= 5 && loading.size < 6; offset++) loadFrame(wantedFrame + offset);
    if (sound && audio.paused && frames.has(index) && playbackTime < duration) {
      audio.currentTime = playbackTime;
      audio.play().catch(() => setSound(false));
    }
    if (playbackTime >= duration) { stopPlayback(); return; }
    playbackRaf = requestAnimationFrame(playbackTick);
  }
  async function startPlayback() {
    if (playing) { stopPlayback(); return; }
    playing = true;
    playbackTime = 0;
    audio.currentTime = 0;
    wantedFrame = 1;
    playButton.replaceChildren(document.createTextNode('Ⅱ '), el('span', '', 'Pausar sequência'));
    playButton.setAttribute('aria-label', 'Pausar sequência de Davi');
    await Promise.all([1, 2, 3, 4, 5, 6].map(loadFrame));
    if (!playing) return;
    if (!frames.has(1)) { stopPlayback(); $('.preview-note').textContent = 'Não foi possível carregar a sequência. As três cenas de Davi estão disponíveis em Nossa caminhada.'; return; }
    updateFilm(0);
    if (sound) audio.play().catch(() => setSound(false));
    previousTick = performance.now();
    playbackRaf = requestAnimationFrame(playbackTick);
  }
  function setSound(enabled) {
    sound = enabled;
    soundButton.textContent = sound ? 'Som ligado' : 'Som desligado';
    soundButton.setAttribute('aria-pressed', String(sound));
    soundButton.setAttribute('aria-label', sound ? 'Desativar áudio da sequência' : 'Ativar áudio da sequência');
    if (!sound) audio.pause();
    else if (playing) { audio.currentTime = playbackTime; audio.play().catch(() => setSound(false)); }
  }
  playButton.addEventListener('click', startPlayback);
  soundButton.addEventListener('click', () => setSound(!sound));
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stopPlayback(); });
  new IntersectionObserver(entries => {
    entries.forEach(entry => {
      filmNear = entry.isIntersecting;
      if (filmNear) { loadFrame(1); scheduleUpdate(); }
      else if (playing) stopPlayback();
    });
  }, { rootMargin: '600px 0px' }).observe(film);

  const bookScenes = $$('.book-scene').filter(scene => !scene.closest('.book-journey'));
  const journeyRows = $$('.library-card', library);
  const heroImage = $('.hero-photo img');
  const portal = $('[data-hero-portal]');
  const portalStage = $('.hero-portal-stage', portal);
  const portalContent = $('.hero-portal-content', portal);
  portal.classList.add('is-enhanced');
  const segment = (value, start, end) => clamp((value - start) / (end - start));
  const smooth = value => value * value * (3 - 2 * value);
  // Adapt the Design System journey: one six-sided volume crosses four rows.
  // Swap original covers while the front faces away during each full turn.
  function updateBookJourney() {
    if (paused) return;
    const rect = library.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const stageTop = parseFloat(getComputedStyle(journeyStage).top) || 0;
    const exit = smooth(clamp((stageTop + journeyStage.offsetHeight - rect.bottom) / (journeyStage.offsetHeight * .45)));
    journeyScene.style.opacity = String(1 - exit);
    const rowHeight = journeyRows[0].offsetHeight;
    const position = clamp((stageTop - rect.top) / Math.max(1, rowHeight), 0, journeyRows.length - 1);
    const row = Math.min(Math.floor(position), journeyRows.length - 2);
    const phase = smooth(segment(position - row, .2, .8));
    const index = row + (phase >= .5 ? 1 : 0);
    const from = row % 2 === 0 ? 74 : 26;
    const to = row % 2 === 0 ? 26 : 74;
    const side = from + (to - from) * phase;
    const mobile = innerWidth <= 700;
    journeyScene.style.left = `${mobile ? 50 + (side - 50) * .18 : side}%`;
    journeyObject.style.setProperty('--book-ry', `${-22 + (row + phase) * 360}deg`);
    journeyObject.style.setProperty('--book-x', `${7 + Math.sin(phase * Math.PI * 2) * 12}deg`);
    journeyObject.style.setProperty('--book-rz', `${(row % 2 === 0 ? -4 : 4) * (1 - phase * 2)}deg`);
    journeyObject.style.setProperty('--book-y', `${-Math.sin(phase * Math.PI) * 25}px`);
    journeyObject.style.setProperty('--journey-spine', ['#d4d2c8', '#bb571e', '#674739', '#1f514b'][index]);
    journeyFronts.forEach((front, i) => { front.style.visibility = i === index ? 'visible' : 'hidden'; });
    library.dataset.activeBook = window.HDS_BOOKS[index].id;
  }
  function updatePortal() {
    const rect = portal.getBoundingClientRect();
    const progress = paused ? 1 : clamp(-rect.top / Math.max(1, rect.height - portalStage.offsetHeight));
    const opening = smooth(segment(progress, 0.04, 0.53));
    const reveal = smooth(segment(progress, 0.6, 0.91));
    portal.style.setProperty('--portal-progress', progress.toFixed(4));
    portal.style.setProperty('--portal-opening', opening.toFixed(4));
    portal.style.setProperty('--portal-reveal', reveal.toFixed(4));
    portal.style.setProperty('--portal-scale', (.82 + opening * .62 + reveal * 1.35).toFixed(4));
    portal.style.setProperty('--portal-turn', `${opening * -12}deg`);
    portal.style.setProperty('--portal-emblem-opacity', String(1 - reveal));
    portal.style.setProperty('--portal-intro', String(1 - smooth(segment(progress, .35, .6))));
    portal.style.setProperty('--portal-intro-y', `${-45 * opening}px`);
    portal.classList.toggle('is-revealing', reveal > .01);
    portal.classList.toggle('is-revealed', reveal > .9);
    portalContent.inert = reveal <= .9;
  }
  function updateScroll() {
    requestRaf = 0;
    const vh = window.innerHeight;
    navBar.classList.toggle('is-scrolled', scrollY > 40);
    updatePortal();
    updateBookJourney();
    if (!paused) {
      bookScenes.forEach(scene => {
        const rect = scene.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > vh + 100) return;
        const progress = clamp((vh - rect.top) / (vh + rect.height));
        const object = $('.book-object', scene);
        object.style.setProperty('--book-ry', `${-12 - progress * 43}deg`);
        object.style.setProperty('--book-x', `${10 - progress * 16}deg`);
        object.style.setProperty('--book-rz', `${-6 + progress * 9}deg`);
        object.style.setProperty('--book-y', `${(0.5 - progress) * 25}px`);
        scene.style.setProperty('--shadow-scale', `${0.8 + progress * 0.3}`);
      });
      if (portal.getBoundingClientRect().bottom > 0) heroImage.style.transform = `scale(${1.06 + clamp(scrollY / Math.max(1, portal.offsetHeight)) * .03})`;
      if (filmNear && !playing) {
        const rect = film.getBoundingClientRect();
        updateFilm(clamp(-rect.top / Math.max(1, rect.height - vh)));
      }
    }
  }
  function scheduleUpdate() { if (!requestRaf) requestRaf = requestAnimationFrame(updateScroll); }
  window.addEventListener('scroll', () => { if (playing) stopPlayback(); scheduleUpdate(); }, { passive: true });
  window.addEventListener('resize', () => { if (innerWidth > 850) closeMenu(); scheduleUpdate(); });
  const motionButton = $('.motion-toggle');
  function applyMotion() {
    document.documentElement.classList.toggle('motion-paused', paused);
    portal.classList.toggle('is-static', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Ativar animações' : 'Pausar animações');
    motionButton.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
    if (paused) { stopPlayback(); heroImage.style.transform = ''; }
    scheduleUpdate();
  }
  motionButton.addEventListener('click', () => { paused = !paused; applyMotion(); });
  reduced.addEventListener('change', event => { paused = event.matches; applyMotion(); });
  applyMotion();
  scheduleUpdate();
})();
