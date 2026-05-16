import './styles.css';

const root = document.documentElement;
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollScrubVideo = document.querySelector('[data-scroll-scrub-video]');

let targetProgress = 0;
let currentProgress = 0;
let frameRequest = 0;
let scrollVideoDuration = 0;
let lastScrollVideoFrame = -1;

const scrollVideoFrameRate = Number.parseFloat(scrollScrubVideo?.dataset.scrollScrubFps ?? '24') || 24;

const clampProgress = (value) => Math.min(1, Math.max(0, value));

const smoothstep = (edgeStart, edgeEnd, value) => {
  const progress = clampProgress((value - edgeStart) / (edgeEnd - edgeStart));

  return progress * progress * (3 - 2 * progress);
};

const stagedPresence = (value, enterStart, enterEnd, exitStart, exitEnd) => {
  const enter = smoothstep(enterStart, enterEnd, value);
  const exit = smoothstep(exitStart, exitEnd, value);

  return clampProgress(enter * (1 - exit));
};

const readScrollProgress = () => {
  const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);

  return clampProgress(window.scrollY / maxScroll);
};

const setNumericProperty = (name, value) => {
  root.style.setProperty(name, value.toFixed(4));
};

const setLengthProperty = (name, value, unit) => {
  root.style.setProperty(name, `${value.toFixed(3)}${unit}`);
};

const syncScrollVideo = (progress, force = false) => {
  if (!scrollScrubVideo || scrollVideoDuration <= 0) {
    return;
  }

  const maxFrame = Math.max(1, Math.floor(scrollVideoDuration * scrollVideoFrameRate) - 1);
  const frame = Math.round(clampProgress(progress) * maxFrame);

  if (!force && frame === lastScrollVideoFrame) {
    return;
  }

  lastScrollVideoFrame = frame;

  const targetTime = Math.min(scrollVideoDuration - 0.035, frame / scrollVideoFrameRate);

  if (!Number.isFinite(targetTime) || Math.abs(scrollScrubVideo.currentTime - targetTime) < 0.018) {
    return;
  }

  scrollScrubVideo.currentTime = Math.max(0, targetTime);
};

const prepareScrollVideo = () => {
  if (!scrollScrubVideo) {
    return;
  }

  scrollScrubVideo.muted = true;
  scrollScrubVideo.pause();

  if (Number.isFinite(scrollScrubVideo.duration) && scrollScrubVideo.duration > 0) {
    scrollVideoDuration = scrollScrubVideo.duration;
    syncScrollVideo(currentProgress, true);
  }
};

const writeProgress = (progress) => {
  const inverseProgress = 1 - progress;
  const titleExit = smoothstep(0.07, 0.18, progress);
  const copyOnePresence = stagedPresence(progress, 0.14, 0.26, 0.38, 0.5);
  const copyTwoPresence = smoothstep(0.43, 0.58, progress);

  root.style.setProperty('--scroll-progress', progress.toFixed(4));
  root.style.setProperty('--scroll-progress-inverse', inverseProgress.toFixed(4));

  setNumericProperty('--title-opacity', 1 - titleExit);
  setLengthProperty('--title-y', titleExit * -8, 'dvh');
  setLengthProperty('--title-blur', titleExit * 10, 'px');

  setNumericProperty('--copy-one-opacity', copyOnePresence);
  setLengthProperty('--copy-one-y', (1 - copyOnePresence) * 11 - smoothstep(0.38, 0.5, progress) * 7, 'dvh');
  setLengthProperty('--copy-one-blur', (1 - copyOnePresence) * 18 + smoothstep(0.38, 0.5, progress) * 10, 'px');

  setNumericProperty('--copy-two-opacity', copyTwoPresence);
  setLengthProperty('--copy-two-y', (1 - copyTwoPresence) * 11, 'dvh');
  setLengthProperty('--copy-two-blur', (1 - copyTwoPresence) * 18, 'px');

  syncScrollVideo(progress);
};

const settleProgress = () => {
  const easing = reduceMotionQuery.matches ? 1 : 0.075;

  currentProgress += (targetProgress - currentProgress) * easing;

  if (Math.abs(targetProgress - currentProgress) < 0.0005) {
    currentProgress = targetProgress;
  }

  writeProgress(currentProgress);

  if (currentProgress === targetProgress) {
    frameRequest = 0;
    return;
  }

  frameRequest = window.requestAnimationFrame(settleProgress);
};

const requestProgressUpdate = () => {
  targetProgress = readScrollProgress();

  if (!frameRequest) {
    frameRequest = window.requestAnimationFrame(settleProgress);
  }
};

const resetProgress = () => {
  targetProgress = readScrollProgress();
  currentProgress = targetProgress;
  writeProgress(currentProgress);
};

const createTuningPanel = () => {
  if (!import.meta.env.DEV) {
    return;
  }

  const storageKey = 'marble-cake-family:tuning-panel:v1';
  const panelHiddenKey = 'marble-cake-family:tuning-panel:hidden';
  const savedValues = JSON.parse(window.localStorage.getItem(storageKey) || '{}');

  const sections = [
    {
      title: 'Video',
      controls: [
        { label: 'Blur suave', property: '--media-soften', min: 0, max: 2.2, step: 0.01, value: 1.17, unit: 'px' },
        { label: 'Saturación', property: '--media-saturation', min: 0.8, max: 2.4, step: 0.01, value: 1.64 },
        { label: 'Contraste', property: '--media-contrast', min: 0.75, max: 1.45, step: 0.01, value: 0.99 },
        { label: 'Brillo', property: '--media-brightness', min: 0.75, max: 1.35, step: 0.01, value: 0.82 },
      ],
    },
    {
      title: 'Granulado',
      controls: [
        { label: 'Tamaño', property: '--grain-size', min: 44, max: 220, step: 1, value: 81, unit: 'px' },
        { label: 'Intensidad', property: '--grain-opacity', min: 0, max: 1, step: 0.01, value: 0.31 },
      ],
    },
    {
      title: 'Encuadre',
      controls: [
        { label: 'Zoom fondo', property: '--image-zoom', min: 1, max: 1.8, step: 0.01, value: 1.25 },
        { label: 'Pan horizontal', property: '--image-pan-x', min: -70, max: 10, step: 0.5, value: -25, unit: 'dvw' },
        { label: 'Pan vertical', property: '--image-pan-y', min: -70, max: 10, step: 0.5, value: -25, unit: 'dvh' },
        { label: 'Ancho letras', property: '--display-letter-width', min: 0.62, max: 1, step: 0.01, value: 0.62 },
      ],
    },
  ];

  const allControls = sections.flatMap((section) => section.controls);

  const formatValue = (control, value) => `${Number(value).toFixed(control.step < 1 ? 2 : 0)}${control.unit ?? ''}`;
  const writeControlValue = (control, value) => {
    const nextValue = Number(value);
    root.style.setProperty(control.property, `${nextValue}${control.unit ?? ''}`);
    savedValues[control.property] = nextValue;
    window.localStorage.setItem(storageKey, JSON.stringify(savedValues));
  };

  allControls.forEach((control) => {
    writeControlValue(control, savedValues[control.property] ?? control.value);
  });

  const panel = document.createElement('aside');
  panel.className = 'tuning-panel';
  panel.setAttribute('aria-label', 'Local visual tuning panel');

  panel.innerHTML = `
    <div class="tuning-panel__head">
      <div>
        <div class="tuning-panel__kicker">Local tuning</div>
        <div class="tuning-panel__title">Marble Cake controls</div>
        <div class="tuning-panel__hint">Sólo aparece en dev. Presiona H para mostrar/ocultar.</div>
      </div>
      <button class="tuning-panel__close" type="button" data-panel-hide aria-label="Hide panel">×</button>
    </div>
    ${sections.map((section) => `
      <section class="tuning-panel__section">
        <div class="tuning-panel__section-title">${section.title}</div>
        ${section.controls.map((control) => {
          const value = savedValues[control.property] ?? control.value;
          return `
            <label class="tuning-panel__control">
              <span class="tuning-panel__label-row">
                <span class="tuning-panel__label">${control.label}</span>
                <span class="tuning-panel__value" data-value-for="${control.property}">${formatValue(control, value)}</span>
              </span>
              <input
                class="tuning-panel__range"
                type="range"
                min="${control.min}"
                max="${control.max}"
                step="${control.step}"
                value="${value}"
                data-property="${control.property}"
              />
            </label>
          `;
        }).join('')}
      </section>
    `).join('')}
    <div class="tuning-panel__actions">
      <button class="tuning-panel__button" type="button" data-panel-reset>Reset</button>
    </div>
  `;

  document.body.append(panel);

  const setPanelHidden = (hidden) => {
    panel.hidden = hidden;
    window.localStorage.setItem(panelHiddenKey, hidden ? '1' : '0');
  };

  setPanelHidden(true);

  panel.addEventListener('input', (event) => {
    const input = event.target.closest('[data-property]');

    if (!input) {
      return;
    }

    const control = allControls.find((item) => item.property === input.dataset.property);

    if (!control) {
      return;
    }

    writeControlValue(control, input.value);
    panel.querySelector(`[data-value-for="${control.property}"]`).textContent = formatValue(control, input.value);
  });

  panel.querySelector('[data-panel-hide]').addEventListener('click', () => setPanelHidden(true));
  panel.querySelector('[data-panel-reset]').addEventListener('click', () => {
    window.localStorage.removeItem(storageKey);

    allControls.forEach((control) => {
      writeControlValue(control, control.value);
      const input = panel.querySelector(`[data-property="${control.property}"]`);
      const value = panel.querySelector(`[data-value-for="${control.property}"]`);
      input.value = control.value;
      value.textContent = formatValue(control, control.value);
    });
  });

  window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() !== 'h' || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    setPanelHidden(!panel.hidden);
  });
};

resetProgress();
createTuningPanel();

window.addEventListener('scroll', requestProgressUpdate, { passive: true });
window.addEventListener('resize', resetProgress);
reduceMotionQuery.addEventListener('change', resetProgress);

if (scrollScrubVideo) {
  scrollScrubVideo.addEventListener('loadedmetadata', prepareScrollVideo);
  scrollScrubVideo.addEventListener('canplay', prepareScrollVideo, { once: true });
  scrollScrubVideo.addEventListener('play', () => scrollScrubVideo.pause());

  if (scrollScrubVideo.readyState >= HTMLMediaElement.HAVE_METADATA) {
    prepareScrollVideo();
  }
}
