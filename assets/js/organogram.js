(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const rows = [
    ['Pastor', 'Principal'], ['Líder', 'Principal'], ['Gestores', '12 gestores'],
    ['Bases', 'Uma por gestor'], ['Líderes de Base', '2 por Base · 24 líderes']
  ];
  let instance = 0;
  document.querySelectorAll('[data-organogram]').forEach(app => {
    const uid = `org-${++instance}`;
    const viewport = app.querySelector('.org-viewport');
    const canvas = app.querySelector('.org-canvas');
    const baseSelect = app.querySelector('[data-org-base]');
    const modeButtons = [...app.querySelectorAll('[data-org-mode]')];
    const zoomOutput = app.querySelector('[data-org-zoom-output]');
    const detailPath = app.querySelector('[data-org-path]');
    const detailText = app.querySelector('[data-org-detail]');
    const badge = app.querySelector('[data-org-badge]');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let mode = matchMedia('(max-width:600px)').matches ? 'base' : 'matrix';
    let selected = mode === 'base' ? 1 : 0;
    let scale = 1, width = 4426, height = 1092, autoFit = true;
    const nodes = [], edges = [];
    const pad = number => String(number).padStart(2, '0');
    const data = window.HDS_ORGANOGRAM;
    const element = (name, attrs = {}, textValue) => {
      const el = document.createElement(name);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
      if (textValue !== undefined) el.textContent = textValue;
      return el;
    };
    const svgElement = (name, attrs = {}) => {
      const el = document.createElementNS(NS, name);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
      return el;
    };
    data.bases.forEach(base => baseSelect.append(element('option', {value:base.id}, base.name)));

    function addNode(id, role, row, base, x, nodeWidth, person, fallback, code) {
      const y = 24 + row * 210;
      const nodeHeight = role === 'member' ? 180 : role === 'base' ? 126 : 150;
      const title = person.name || fallback;
      const subtitle = role === 'base' ? '2 líderes de Base' : person.role;
      const baseData = data.bases.find(item => item.id === base);
      const node = element('button', {
        type:'button', class:`org-node is-${role}`, 'data-org-node':id,
        'aria-label':`${title}. ${subtitle}${base ? `. ${baseData.name}` : ''}`,
        'aria-pressed':'false'
      });
      Object.assign(node.style, {left:`${x}px`, top:`${y}px`, width:`${nodeWidth}px`, height:`${nodeHeight}px`});
      if (row < 2) node.classList.add('is-principal');
      if (role === 'base') {
        node.append(element('img', {class:'org-base-symbol', src:'./assets/images/brand/symbol-orange.webp', alt:''}));
      } else {
        const portrait = element('span', {class:'org-portrait', 'aria-hidden':'true'});
        const silhouette = svgElement('svg', {viewBox:'0 0 64 64', fill:'none'});
        silhouette.append(svgElement('circle', {cx:32, cy:23, r:10, stroke:'currentColor', 'stroke-width':2}), svgElement('path', {d:'M13 56v-5c0-10 8-17 19-17s19 7 19 17v5', stroke:'currentColor', 'stroke-width':2}));
        portrait.append(silhouette);
        if (person.photo) {
          const photo = element('img', {src:person.photo, alt:'', loading:'lazy'});
          photo.addEventListener('error', () => photo.remove(), {once:true});
          portrait.append(photo);
        } else portrait.append(element('small', {}, 'Foto pendente'));
        node.append(portrait);
      }
      const content = element('span', {class:'org-node-content'});
      content.append(element('span', {class:'org-node-code'}, code), element('strong', {class:person.name ? '' : 'org-name-placeholder'}, title), element('small', {class:'org-node-role'}, subtitle));
      node.append(content);
      node.addEventListener('click', () => {
        if (base) selectBase(base);
        else {
          detailText.textContent = `${title} · ${subtitle}. ${row === 0 ? 'Acompanha a direção de toda a estrutura.' : 'Responde ao Pastor e acompanha os 12 Gestores.'}`;
          badge.textContent = title;
        }
      });
      canvas.append(node);
      const nodeData = {id, row, base, x:x+nodeWidth/2, width:nodeWidth, top:y, bottom:y+nodeHeight, element:node};
      nodes.push(nodeData);
      return nodeData;
    }

    function edgePath(source, target) {
      const sx = source.x, sy = source.bottom, tx = target.x, ty = target.top;
      const mid = (sy + ty) / 2;
      const dir = tx > sx ? 1 : -1;
      return sx === tx ? `M${sx} ${sy} V${ty}` :
        `M${sx} ${sy} V${mid-8} Q${sx} ${mid} ${sx+dir*8} ${mid} H${tx-dir*8} Q${tx} ${mid} ${tx} ${mid+8} V${ty}`;
    }

    function addEdge(svg, source, target, base) {
      const edge = svgElement('path', {d:edgePath(source, target), class:'org-edge'});
      svg.append(edge);
      edges.push({source, target, base, element:edge});
    }

    function draw() {
      nodes.length = 0; edges.length = 0; canvas.replaceChildren();
      width = mode === 'matrix' ? 4426 : 460;
      height = 1092;
      app.dataset.orgView = mode;
      app.style.setProperty('--org-width', `${width}px`);
      app.style.setProperty('--org-height', `${height}px`);
      const svg = svgElement('svg', {class:'org-wires', viewBox:`0 0 ${width} ${height}`, 'aria-hidden':'true'});
      const defs = svgElement('defs');
      const filter = svgElement('filter', {id:`${uid}-glow`, filterUnits:'userSpaceOnUse', x:0, y:0, width, height});
      filter.append(svgElement('feDropShadow', {dx:0, dy:3, stdDeviation:4, 'flood-color':'#ff4905', 'flood-opacity':'.45'}));
      defs.append(filter); svg.append(defs); canvas.append(svg);
      rows.forEach(([label, description], row) => {
        const y = 16 + row*210;
        const band = element('div', {class:'org-row-band', 'aria-hidden':'true'});
        band.style.top = `${y}px`; canvas.append(band);
        const labelEl = element('div', {class:'org-row-label'});
        labelEl.style.top = `${y+19}px`;
        labelEl.append(element('b', {}, `0${row+1}`), element('span', {}, label), element('small', {}, description));
        canvas.append(labelEl);
      });
      const center = mode === 'matrix' ? 2264 : 282;
      const principalWidth = mode === 'matrix' ? 332 : 300;
      const pastor = addNode('pastor', 'pastor', 0, 0, center-principalWidth/2, principalWidth, data.pastor, 'Nome a cadastrar', '01 / Direção pastoral');
      const leader = addNode('principal', 'leader', 1, 0, center-principalWidth/2, principalWidth, data.principal, 'Nome a cadastrar', '02 / Liderança geral');
      addEdge(svg, pastor, leader, 0);
      const visible = mode === 'matrix' ? Array.from({length:12}, (_,i)=>i+1) : [selected || 1];
      visible.forEach((base, index) => {
        const code = pad(base);
        const baseData = data.bases.find(item => item.id === base);
        const left = mode === 'matrix' ? 140 + index*356 : 132;
        const nodeWidth = mode === 'matrix' ? 332 : 300;
        const manager = addNode(`gestor-${base}`, 'manager', 2, base, left, nodeWidth, baseData.manager, 'Nome a cadastrar', `G${code}`);
        const baseNode = addNode(`base-${base}`, 'base', 3, base, left, nodeWidth, baseData, `Base ${code}`, `B${code}`);
        const memberWidth = (nodeWidth-16)/2;
        const a = addNode(`lider-${base}-a`, 'member', 4, base, left, memberWidth, baseData.leaders[0], 'Nome a cadastrar', `L${code}A`);
        const b = addNode(`lider-${base}-b`, 'member', 4, base, left+memberWidth+16, memberWidth, baseData.leaders[1], 'Nome a cadastrar', `L${code}B`);
        addEdge(svg, leader, manager, base);
        addEdge(svg, manager, baseNode, base);
        addEdge(svg, baseNode, a, base); addEdge(svg, baseNode, b, base);
      });
      updateSelection();
      autoFit = mode === 'base';
      if (autoFit) fit();
      else {
        applyScale(Math.min(1, Math.max(.72, (viewport.clientWidth-18)/850)), false);
        viewport.scrollTop = 0;
        viewport.scrollLeft = selected ? (140+(selected-1)*356+166)*scale-viewport.clientWidth/2 : 0;
      }
      syncPrincipals();
      modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.orgMode === mode)));
    }

    function updateSelection() {
      canvas.classList.toggle('has-selection', selected > 0);
      nodes.forEach(node => {
        const active = selected > 0 && (node.base === selected || node.base === 0);
        node.element.classList.toggle('is-active', active);
        node.element.setAttribute('aria-pressed', String(active));
      });
      edges.forEach(edge => {
        const active = selected > 0 && (edge.base === selected || edge.base === 0);
        edge.element.classList.toggle('is-active', active);
        if (active) edge.element.setAttribute('filter', `url(#${uid}-glow)`);
        else edge.element.removeAttribute('filter');
      });
      baseSelect.value = String(selected);
      detailPath.replaceChildren();
      const baseData = data.bases.find(item => item.id === selected);
      const chain = selected ? ['Pastor', 'Líder principal', `Gestor ${pad(selected)}`, baseData.name, '2 líderes de Base'] : ['Pastor', 'Líder principal', '12 Gestores', '12 Bases', '24 líderes de Base'];
      chain.forEach((label,index) => {
        if (index) detailPath.append(element('span', {class:'org-detail-arrow', 'aria-hidden':'true'}, '→'));
        detailPath.append(element('b', {}, label));
      });
      detailText.textContent = selected ? `${baseData.name}: ${baseData.manager.name || 'nome do gestor a definir'} · 2 líderes ligados diretamente à Base.` : 'Clique e arraste para explorar as 12 Bases. Selecione uma Base ou use “Uma Base” para acompanhar sua liderança.';
      badge.replaceChildren(element('span', {class:'org-detail-dot', 'aria-hidden':'true'}), document.createTextNode(selected ? baseData.name : '12 Bases · 24 líderes'));
    }

    function selectBase(base) {
      const previous = selected;
      selected = base;
      if (mode === 'base') {
        if (!selected) {mode = 'matrix'; draw();}
        else if (previous !== selected) draw();
        else updateSelection();
      } else {
        updateSelection();
        if (selected) viewport.scrollLeft = (140+(selected-1)*356+166)*scale-viewport.clientWidth/2;
        syncPrincipals();
      }
    }

    function syncPrincipals() {
      if (mode !== 'matrix') return;
      const center = Math.max(306, Math.min(width-190, (viewport.scrollLeft+viewport.clientWidth/2)/scale));
      nodes.filter(node => node.row < 2).forEach(node => {
        node.x = center;
        node.element.style.left = `${center-node.width/2}px`;
      });
      edges.filter(edge => edge.source.row < 2).forEach(edge => edge.element.setAttribute('d', edgePath(edge.source, edge.target)));
    }

    function applyScale(next, preserveCenter = true) {
      const oldScale = scale;
      const cx = (viewport.scrollLeft + viewport.clientWidth/2)/oldScale;
      const cy = (viewport.scrollTop + viewport.clientHeight/2)/oldScale;
      scale = Math.max(.18, Math.min(1.5, next));
      app.style.setProperty('--org-scale', scale.toFixed(4));
      zoomOutput.textContent = `${Math.round(scale*100)}%`;
      app.querySelector('[data-org-zoom="out"]').disabled = scale <= .18;
      app.querySelector('[data-org-zoom="in"]').disabled = scale >= 1.5;
      if (preserveCenter) {
        viewport.scrollLeft = cx*scale-viewport.clientWidth/2;
        viewport.scrollTop = cy*scale-viewport.clientHeight/2;
      }
      syncPrincipals();
    }

    function fit() {
      if (!viewport.clientWidth) return;
      const available = viewport.clientWidth-18;
      const factor = Math.min(1, available/width);
      applyScale(factor, false);
      viewport.scrollLeft = 0; viewport.scrollTop = 0;
    }

    modeButtons.forEach(button => button.addEventListener('click', () => {
      mode = button.dataset.orgMode;
      if (mode === 'base' && !selected) selected = 1;
      draw();
    }));
    baseSelect.addEventListener('change', () => selectBase(Number(baseSelect.value)));
    app.querySelectorAll('[data-org-zoom]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.orgZoom === 'fit') {autoFit = true; fit();}
      else {autoFit = false; applyScale(scale + (button.dataset.orgZoom === 'in' ? .1 : -.1));}
    }));
    // Pan the existing scroll viewport, preserving zoom, centering and wires.
    // Capture only after movement, so an ordinary card click keeps its target.
    let pan = null;
    let suppressPanClick = false;
    viewport.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      suppressPanClick = false;
      pan = {id:event.pointerId, x:event.clientX, y:event.clientY,
        left:viewport.scrollLeft, top:viewport.scrollTop, moved:false};
    });
    viewport.addEventListener('pointermove', event => {
      if (!pan || event.pointerId !== pan.id) return;
      const dx = event.clientX - pan.x;
      const dy = event.clientY - pan.y;
      if (!pan.moved && Math.hypot(dx, dy) < 6) return;
      if (!pan.moved) {
        pan.moved = true;
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add('is-panning');
      }
      event.preventDefault();
      viewport.scrollLeft = pan.left - dx;
      viewport.scrollTop = pan.top - dy;
    });
    function finishPan(event) {
      if (!pan || event.pointerId !== pan.id) return;
      suppressPanClick = pan.moved;
      pan = null;
      viewport.classList.remove('is-panning');
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      // A pointer-generated click follows pointerup synchronously.
      setTimeout(() => {suppressPanClick = false;}, 0);
    }
    viewport.addEventListener('pointerup', finishPan);
    viewport.addEventListener('pointercancel', finishPan);
    viewport.addEventListener('lostpointercapture', finishPan);
    viewport.addEventListener('click', event => {
      if (!suppressPanClick || event.detail === 0) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    viewport.addEventListener('dragstart', event => event.preventDefault());
    viewport.addEventListener('keydown', event => {
      if (event.target !== viewport) return;
      const step = event.shiftKey ? 240 : 80;
      const directions = {ArrowLeft:[-step,0], ArrowRight:[step,0], ArrowUp:[0,-step], ArrowDown:[0,step]};
      if (directions[event.key]) {
        event.preventDefault();
        const [dx, dy] = directions[event.key];
        viewport.scrollLeft += dx;
        viewport.scrollTop += dy;
      }
      if (event.key === '+' || event.key === '=') {event.preventDefault(); autoFit = false; applyScale(scale+.1);}
      if (event.key === '-') {event.preventDefault(); autoFit = false; applyScale(scale-.1);}
      if (event.key === '0') {event.preventDefault(); autoFit = true; fit();}
    });
    let scrollPending = false;
    viewport.addEventListener('scroll', () => {
      if (scrollPending) return;
      scrollPending = true;
      requestAnimationFrame(() => {scrollPending = false; syncPrincipals();});
    }, {passive:true});
    // The original SVG glow treatment is retained; the chart itself adds no looping animation.
    window.addEventListener('message', event => {
      if (event.source === parent && event.origin === location.origin && event.data?.type === 'hds-motion') app.classList.toggle('motion-paused', event.data.paused || reduced.matches);
    });
    const resize = new ResizeObserver(() => {if (autoFit) fit();});
    resize.observe(viewport);
    draw();
  });
})();
