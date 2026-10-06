/* 辰南 · UI interaction bridge
 * Zero-write-on-load mode: visual enhancement must not mutate business state.
 */
(() => {
  const chartSelector = [
    '[data-cn-chart]',
    '.cn-chart',
    '.chart-surface',
    '.line-chart',
    '.bar-chart',
    '.pie-chart',
    '.sparkline'
  ].join(',');

  function ensureChartOverlay(chart) {
    if (!(chart instanceof HTMLElement)) return;
    if (chart.querySelector(':scope > .cn-chart-crosshair')) return;

    chart.classList.add('cn-chart-surface');

    const crosshair = document.createElement('div');
    crosshair.className = 'cn-chart-crosshair';
    crosshair.setAttribute('aria-hidden', 'true');

    const tooltip = document.createElement('div');
    tooltip.className = 'cn-chart-tooltip';
    tooltip.setAttribute('role', 'status');
    tooltip.setAttribute('aria-live', 'polite');

    chart.append(crosshair, tooltip);
  }

  function tooltipText(event) {
    const target = event.target instanceof Element
      ? event.target.closest('[data-value],[data-tooltip],[aria-label],title')
      : null;
    if (!target) return '当前位置';
    return target.getAttribute('data-tooltip')
      || target.getAttribute('data-value')
      || target.getAttribute('aria-label')
      || target.getAttribute('title')
      || '当前位置';
  }

  document.addEventListener('pointerover', (event) => {
    const target = event.target instanceof Element ? event.target.closest(chartSelector) : null;
    if (!target) return;
    ensureChartOverlay(target);
  }, { passive: true });

  document.addEventListener('pointermove', (event) => {
    const chart = event.target instanceof Element ? event.target.closest(chartSelector) : null;
    if (!(chart instanceof HTMLElement)) return;

    ensureChartOverlay(chart);
    const rect = chart.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    chart.style.setProperty('--cn-chart-x', x + 'px');
    chart.style.setProperty('--cn-chart-y', y + 'px');

    const tooltip = chart.querySelector(':scope > .cn-chart-tooltip');
    if (tooltip) {
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
      tooltip.textContent = tooltipText(event);
    }

    chart.classList.add('is-hovering');
  }, { passive: true });

  document.addEventListener('pointerout', (event) => {
    const chart = event.target instanceof Element ? event.target.closest(chartSelector) : null;
    if (!(chart instanceof HTMLElement)) return;
    const next = event.relatedTarget;
    if (next instanceof Node && chart.contains(next)) return;
    chart.classList.remove('is-hovering');
  }, { passive: true });
})();
