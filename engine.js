// engine.js — Slide navigation + step runner + DOM rendering
// Uses plain globals (no ES modules) so it works on file:// without a server.

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  let currentSlide = 0;
  let totalSlides  = 0;
  const simStates  = {};   // keyed by example index
  let autoTimers   = {};   // keyed by example index

  // ── Simulation State ───────────────────────────────────────────────────────
  class SimulationState {
    constructor(example) {
      this.example = example;
      this.steps   = example.steps;
      this.total   = example.steps.length;
      this.current = -1;
    }
    reset()   { this.current = -1; }
    canStep() { return this.current < this.total - 1; }
    canBack() { return this.current >= 0; }
    advance() {
      if (this.canStep()) this.current++;
      return this.steps[this.current];
    }
    back() {
      if (this.canBack()) this.current--;
      return this.steps[this.current]; // undefined when current is -1
    }
    currentStep() {
      return this.current >= 0 ? this.steps[this.current] : null;
    }
  }

  // ── Slide Navigation ───────────────────────────────────────────────────────
  function goToSlide(n) {
    const slidesEl = document.getElementById('slides');
    const dots = document.querySelectorAll('.slide-dot');
    const counter = document.getElementById('slide-counter');
    const titleNav = document.getElementById('slide-title-nav');

    n = Math.max(0, Math.min(n, totalSlides - 1));
    currentSlide = n;
    slidesEl.style.transform = `translateX(-${n * 100}vw)`;

    dots.forEach((d, i) => d.classList.toggle('active', i === n));
    counter.textContent = `${n + 1} / ${totalSlides}`;

    const slideEl = document.querySelectorAll('.slide')[n];
    if (slideEl) {
      titleNav.textContent = slideEl.dataset.title || '';
    }
  }

  function nextSlide() { goToSlide(currentSlide + 1); }
  function prevSlide() { goToSlide(currentSlide - 1); }

  // ── DOM Rendering ──────────────────────────────────────────────────────────
  // Normalize a label into a stable key so an item can be tracked across
  // columns even if its label text changes slightly. We strip the "cb:"
  // prefix and trailing STATE annotations, and for "<source> → <target>"
  // labels (e.g. a UI event "🖱 click → handler()") we keep only the target,
  // so it matches the frame that lands on the Call Stack ("handler()").
  function itemKey(label) {
    let s = label
      .replace(/^cb:\s*/, '')
      .replace(/\s*\((?:esperando|en vuelo|pendiente)\)\s*$/i, '')
      .replace(/[…⏳✅\s]+$/u, '')
      .trim();
    // If there's an arrow, the meaningful identity is the target (right side).
    const arrowIdx = s.lastIndexOf('→');
    if (arrowIdx !== -1) s = s.slice(arrowIdx + 1).trim();
    return s;
  }

  function renderQueue(containerEl, items) {
    containerEl.innerHTML = '';
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'queue-item';
      el.dataset.type = item.type;
      el.dataset.key  = itemKey(item.label);
      if (item.executing) el.classList.add('executing');
      if (item.blocked)   el.classList.add('blocked');
      if (item.warning)   el.classList.add('warning');
      el.textContent = item.label;
      if (item.warning) {
        const badge = document.createElement('span');
        badge.className = 'starvation-badge';
        badge.textContent = '⚠ STARVED';
        el.appendChild(badge);
        el.style.position = 'relative';
      }
      containerEl.appendChild(el);
    });
  }

  // Capture current on-screen position of every queue item, keyed by item key.
  function captureRects(slideEl) {
    const map = {};
    slideEl.querySelectorAll('.queue-item').forEach(el => {
      const key = el.dataset.key;
      if (!key) return;
      map[key] = {
        rect: el.getBoundingClientRect(),
        col:  el.closest('.queue-col')?.dataset.queue || null
      };
    });
    return map;
  }

  // Animate ONLY the meaningful move: the Event Loop dispatching a task from a
  // queue into the Call Stack. A floating clone flies from the queue slot to
  // the new call-stack slot. We deliberately ignore every other transition
  // (items entering queues, render/UI state changes) to avoid stray sweeps.
  function animateMoves(slideEl, prevRects) {
    let loopActed = false;
    if (!prevRects) return false;

    slideEl.querySelectorAll('.queue-col[data-queue="callstack"] .queue-item').forEach(el => {
      const key = el.dataset.key;
      if (!key || !prevRects[key]) return;

      const prev = prevRects[key];
      // Only animate if the item came FROM one of the real queues (not from
      // the call stack itself or web apis). Render is included because an rAF
      // callback can move from the Render queue into the Call Stack.
      const QUEUES = ['microtask', 'render', 'ui', 'task'];
      if (!QUEUES.includes(prev.col)) return;

      const newRect = el.getBoundingClientRect();
      const dx = newRect.left - prev.rect.left;
      const dy = newRect.top  - prev.rect.top;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;

      loopActed = true;

      // Build a floating clone positioned (fixed) at the OLD spot.
      const ghost = el.cloneNode(true);
      ghost.classList.add('flying-ghost');
      ghost.style.position = 'fixed';
      ghost.style.left   = prev.rect.left + 'px';
      ghost.style.top    = prev.rect.top + 'px';
      ghost.style.width  = prev.rect.width + 'px';
      ghost.style.height = prev.rect.height + 'px';
      ghost.style.margin = '0';
      ghost.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1)';
      document.body.appendChild(ghost);

      // Hide the real element while the ghost travels.
      el.style.visibility = 'hidden';

      // PLAY on next frame: translate the ghost by the delta to the new spot.
      requestAnimationFrame(() => {
        ghost.style.transform = `translate(${dx}px, ${dy}px)`;
      });

      const done = () => {
        ghost.remove();
        el.style.visibility = '';
      };
      ghost.addEventListener('transitionend', done, { once: true });
      setTimeout(done, 650); // safety net
    });

    return loopActed;
  }

  function pingEventLoop(slideEl) {
    const icon = slideEl.querySelector('.event-loop-icon');
    if (!icon) return;
    icon.classList.remove('pinging');
    // force reflow so the animation can re-trigger
    void icon.offsetWidth;
    icon.classList.add('pinging');
    setTimeout(() => icon.classList.remove('pinging'), 650);
  }

  // Full-screen flash to make the "render / paint" phase visible: a sweep of
  // light + a "🎨 RENDER" label pulse across the whole page.
  let paintFlashEl = null;
  function paintFlash() {
    if (!paintFlashEl) {
      paintFlashEl = document.createElement('div');
      paintFlashEl.id = 'paint-flash';
      paintFlashEl.innerHTML = '<span class="paint-flash-label">🎨 RENDER · repintando la pantalla</span>';
      document.body.appendChild(paintFlashEl);
    }
    paintFlashEl.classList.remove('active');
    void paintFlashEl.offsetWidth; // reflow to restart the animation
    paintFlashEl.classList.add('active');
  }

  function renderStep(slideEl, step, exIdx, animate) {
    const get = (id) => slideEl.querySelector(`[data-q="${id}"]`);

    // FIRST: capture positions before the DOM changes (for FLIP).
    const prevRects = animate ? captureRects(slideEl) : null;

    renderQueue(get('callstack'),  step.callStack      || []);
    renderQueue(get('ui'),         step.uiQueue        || []);
    renderQueue(get('task'),       step.taskQueue      || []);
    renderQueue(get('render'),     step.renderQueue    || []);
    renderQueue(get('microtask'),  step.microtaskQueue || []);

    // Web APIs column: new `webApis` field, fall back to legacy `browserIO`.
    const webApisItems = step.webApis || step.browserIO || [];
    const webApisCol = get('webapis');
    if (webApisCol) renderQueue(webApisCol, webApisItems);

    // LAST + INVERT + PLAY: animate items that changed column.
    if (animate) {
      const loopActed = animateMoves(slideEl, prevRects);
      if (loopActed) pingEventLoop(slideEl);
    }

    // Whole-page "paint flash" when the render phase actually runs in this step
    // (a render item marked executing). Only on forward/animated transitions.
    if (animate) {
      const renderRunning = (step.renderQueue || []).some(it => it.executing);
      if (renderRunning) paintFlash();
    }

    // output
    const outputEl = slideEl.querySelector('.output-lines');
    if (outputEl) {
      outputEl.innerHTML = '';
      (step.output || []).forEach(line => {
        const el = document.createElement('div');
        el.className = 'output-line';
        el.textContent = line;
        outputEl.appendChild(el);
      });
    }

    // active line highlight
    updateLineHighlight(slideEl, step.activeLine);

    // step description
    const descEl = slideEl.querySelector('.step-description');
    if (descEl) descEl.textContent = step.description || '';

    // step counter
    const state = simStates[exIdx];
    const counterEl = slideEl.querySelector('.step-counter');
    if (counterEl && state) {
      counterEl.textContent = `Paso ${state.current + 1} / ${state.total}`;
    }

    // button states
    const btnStep = slideEl.querySelector('.btn-step');
    if (btnStep && state) btnStep.disabled = !state.canStep();
    const btnBack = slideEl.querySelector('.btn-back');
    if (btnBack && state) btnBack.disabled = !state.canBack();
  }

  function updateLineHighlight(slideEl, lineIndex) {
    const pre = slideEl.querySelector('pre');
    const hl  = slideEl.querySelector('.line-highlight');
    if (!pre || !hl) return;

    if (lineIndex == null || lineIndex < 0) {
      hl.classList.remove('visible');
      return;
    }

    const lineEls = slideEl.querySelectorAll('.code-line');
    const lineEl  = lineEls[lineIndex];
    if (!lineEl) {
      hl.classList.remove('visible');
      return;
    }

    // Measure the line's real position relative to the code-panel.
    // offsetTop of the span is relative to <pre>; add pre's offsetTop and
    // subtract scroll so the overlay (a sibling of <pre>) lines up exactly.
    const top = pre.offsetTop + lineEl.offsetTop - pre.scrollTop;
    hl.style.top    = top + 'px';
    hl.style.height = lineEl.offsetHeight + 'px';
    hl.classList.add('visible');
  }

  // ── Per-slide Step Controls ────────────────────────────────────────────────
  function initExampleSlide(slideEl, exIdx) {
    const example = window.EXAMPLES[exIdx];
    if (!example) return;

    const state = new SimulationState(example);
    simStates[exIdx] = state;

    const btnStep  = slideEl.querySelector('.btn-step');
    const btnBack  = slideEl.querySelector('.btn-back');
    const btnReset = slideEl.querySelector('.btn-reset');
    const btnRun   = slideEl.querySelector('.btn-run');

    // Render the initial empty state (step 0, before any action).
    function renderEmpty() {
      slideEl.querySelectorAll('.queue-items').forEach(c => c.innerHTML = '');
      const outputEl = slideEl.querySelector('.output-lines');
      if (outputEl) outputEl.innerHTML = '';
      const hl = slideEl.querySelector('.line-highlight');
      if (hl) hl.classList.remove('visible');
      const descEl = slideEl.querySelector('.step-description');
      if (descEl) descEl.textContent = 'Presiona "Siguiente Paso" para comenzar.';
      const counterEl = slideEl.querySelector('.step-counter');
      if (counterEl) counterEl.textContent = `Paso 0 / ${state.total}`;
      if (btnStep) btnStep.disabled = false;
      if (btnBack) btnBack.disabled = true;
    }

    function doStep() {
      if (!state.canStep()) return;
      const step = state.advance();
      renderStep(slideEl, step, exIdx, true);
    }

    function doBack() {
      if (!state.canBack()) return;
      stopAuto(exIdx);
      const step = state.back();
      if (state.current < 0) {
        renderEmpty();
      } else {
        renderStep(slideEl, step, exIdx, true);
      }
    }

    function doReset() {
      stopAuto(exIdx);
      state.reset();
      renderEmpty();
      if (btnRun) { btnRun.textContent = 'Ejecutar Todo'; btnRun.disabled = false; }
    }

    function startAuto() {
      if (autoTimers[exIdx]) return;
      if (!state.canStep()) state.reset();
      if (btnRun) btnRun.textContent = 'Pausar';
      autoTimers[exIdx] = setInterval(() => {
        if (!state.canStep()) {
          stopAuto(exIdx);
          return;
        }
        const step = state.advance();
        renderStep(slideEl, step, exIdx, true);
      }, 1000);
    }

    function stopAuto(idx) {
      clearInterval(autoTimers[idx]);
      delete autoTimers[idx];
      if (btnRun) { btnRun.textContent = 'Ejecutar Todo'; }
    }

    if (btnStep)  btnStep.addEventListener('click', doStep);
    if (btnBack)  btnBack.addEventListener('click', doBack);
    if (btnReset) btnReset.addEventListener('click', doReset);
    if (btnRun) {
      btnRun.addEventListener('click', () => {
        if (autoTimers[exIdx]) { stopAuto(exIdx); }
        else { startAuto(); }
      });
    }

    // init counter
    const counterEl = slideEl.querySelector('.step-counter');
    if (counterEl) counterEl.textContent = `Paso 0 / ${state.total}`;
    const descEl = slideEl.querySelector('.step-description');
    if (descEl) descEl.textContent = 'Presiona "Siguiente Paso" para comenzar.';
    if (btnBack) btnBack.disabled = true;
  }

  // ── Build slides from EXAMPLES ────────────────────────────────────────────
  function buildExampleSlides() {
    const slidesEl = document.getElementById('slides');
    // Insert before the summary slide (last child of #slides)
    const summarySlide = slidesEl.querySelector('.slide-summary');

    window.EXAMPLES.forEach((ex, exIdx) => {
      const slide = document.createElement('section');
      slide.className = 'slide slide-example';
      slide.dataset.title = ex.title;

      const showIO = ex.showIO === true;

      slide.innerHTML = `
        <div class="slide-header">
          <h2>${ex.title}</h2>
          <p>${ex.description}</p>
        </div>
        <div class="slide-body">
          <div class="code-panel">
            <pre><code class="language-js">${escapeHtml(ex.code)}</code></pre>
            <div class="line-highlight"></div>
          </div>
          <div class="diagram-panel">
            <div class="exec-row">
              <div class="queue-col" data-queue="callstack">
                <div class="queue-col-header">
                  <h3>Call Stack</h3>
                  <div class="queue-subtitle">El motor JS · una función a la vez</div>
                </div>
                <div class="queue-items" data-q="callstack"></div>
              </div>
              <div class="queue-col" data-queue="webapis">
                <div class="queue-col-header">
                  <h3>Web APIs ${showIO ? '/ OS' : ''}</h3>
                  <div class="queue-subtitle">${showIO ? 'Timers · fetch · epoll · I/O' : 'Timers · DOM · async del navegador'}</div>
                </div>
                <div class="queue-items" data-q="webapis"></div>
              </div>
            </div>
            <div class="event-loop-bar">
              <div class="event-loop-icon" data-q="eventloop" title="Event Loop">
                <span class="el-ring">↻</span>
                <span class="el-label">Event Loop</span>
              </div>
            </div>
            <div class="queues-grid">
              <div class="queue-col" data-queue="ui">
                <div class="queue-col-header">
                  <h3>UI Event Queue</h3>
                  <div class="queue-subtitle">① 1 macrotask por vuelta · click · input</div>
                </div>
                <div class="queue-items" data-q="ui"></div>
              </div>
              <div class="queue-col" data-queue="task">
                <div class="queue-col-header">
                  <h3>Task Queue</h3>
                  <div class="queue-subtitle">① 1 macrotask por vuelta · setTimeout</div>
                </div>
                <div class="queue-items" data-q="task"></div>
              </div>
              <div class="queue-col" data-queue="render">
                <div class="queue-col-header">
                  <h3>Render / rAF</h3>
                  <div class="queue-subtitle">③ al final de la vuelta · rAF + paint</div>
                </div>
                <div class="queue-items" data-q="render"></div>
              </div>
              <div class="queue-col" data-queue="microtask">
                <div class="queue-col-header">
                  <h3>Microtask Queue</h3>
                  <div class="queue-subtitle">② tras CADA tarea · ANTES del render</div>
                </div>
                <div class="queue-items" data-q="microtask"></div>
              </div>
            </div>
            <div class="output-panel">
              <h4>Console Output</h4>
              <div class="output-lines"></div>
            </div>
          </div>
        </div>
        <div class="controls">
          <button class="btn btn-reset">Reiniciar</button>
          <button class="btn btn-back">← Paso Anterior</button>
          <button class="btn btn-step">Siguiente Paso →</button>
          <button class="btn btn-run">Ejecutar Todo</button>
          <span class="step-counter">Paso 0 / ${ex.steps.length}</span>
          <p class="step-description">Presiona "Siguiente Paso" para comenzar.</p>
        </div>
      `;

      slidesEl.insertBefore(slide, summarySlide);
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Wrap each line of Prism-highlighted code in <span class="code-line"> so we
  // can measure each line's real offsetTop and position the highlight exactly.
  function wrapHighlightedLines() {
    document.querySelectorAll('.code-panel pre code').forEach(code => {
      const html = code.innerHTML;
      // Split on newlines. Prism tokens don't span lines for JS, so this is safe.
      const lines = html.split('\n');
      code.innerHTML = lines
        .map(line => `<span class="code-line">${line.length ? line : '&nbsp;'}</span>`)
        .join('\n');
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    // Build dynamic example slides
    buildExampleSlides();

    // Re-run Prism on newly created code blocks
    if (window.Prism) Prism.highlightAll();

    // After highlighting, split each <code> into per-line spans so the
    // line-highlight overlay can track exact pixel positions (no drift).
    wrapHighlightedLines();

    const allSlides = document.querySelectorAll('.slide');
    totalSlides = allSlides.length;

    // Build nav dots
    const dotsEl = document.getElementById('slide-dots');
    allSlides.forEach((s, i) => {
      const dot = document.createElement('button');
      dot.className = 'slide-dot' + (i === 0 ? ' active' : '');
      dot.title = s.dataset.title || `Slide ${i + 1}`;
      dot.addEventListener('click', () => goToSlide(i));
      dotsEl.appendChild(dot);
    });

    // Init example slides
    document.querySelectorAll('.slide-example').forEach((slideEl, i) => {
      // find which EXAMPLES index this maps to
      // example slides start after slide 0 (title)
      const exIdx = i;
      initExampleSlide(slideEl, exIdx);
    });

    // Nav buttons
    document.getElementById('btn-prev').addEventListener('click', prevSlide);
    document.getElementById('btn-next').addEventListener('click', nextSlide);

    // Keyboard
    document.addEventListener('keydown', e => {
      // don't steal keypresses from buttons when focused
      if (['INPUT', 'BUTTON', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          nextSlide(); break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          prevSlide(); break;
        case ' ':
          e.preventDefault();
          if (e.shiftKey) backCurrentExample();
          else stepCurrentExample();
          break;
        case 'Backspace':
          e.preventDefault();
          backCurrentExample(); break;
        case 'r':
        case 'R':
          resetCurrentExample(); break;
      }
    });

    // Touch swipe
    let touchStartX = 0;
    document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) { dx < 0 ? nextSlide() : prevSlide(); }
    }, { passive: true });

    goToSlide(0);
  }

  function stepCurrentExample() {
    const slideEl = document.querySelectorAll('.slide')[currentSlide];
    if (!slideEl || !slideEl.classList.contains('slide-example')) return;
    const btn = slideEl.querySelector('.btn-step');
    if (btn && !btn.disabled) btn.click();
  }

  function backCurrentExample() {
    const slideEl = document.querySelectorAll('.slide')[currentSlide];
    if (!slideEl || !slideEl.classList.contains('slide-example')) return;
    const btn = slideEl.querySelector('.btn-back');
    if (btn && !btn.disabled) btn.click();
  }

  function resetCurrentExample() {
    const slideEl = document.querySelectorAll('.slide')[currentSlide];
    if (!slideEl || !slideEl.classList.contains('slide-example')) return;
    const btn = slideEl.querySelector('.btn-reset');
    if (btn) btn.click();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
