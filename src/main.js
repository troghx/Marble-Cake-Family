import './styles.css';

const root = document.documentElement;
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let targetProgress = 0;
let currentProgress = 0;
let frameRequest = 0;

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

resetProgress();
window.addEventListener('scroll', requestProgressUpdate, { passive: true });
window.addEventListener('resize', resetProgress);
reduceMotionQuery.addEventListener('change', resetProgress);
