/* 辰南 · UI interaction bridge
 * Adds Lumen-style interaction behavior without changing business logic.
 */
(() => {
  const root = document.documentElement;
  root.dataset.uiPlugin = 'lumen-polish-v1';

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
    if (chart.dataset.cnChartEnhanced === '1') return;
    chart.dataset.cnChartEnhanced = '1';
    chart.classList.add('cn-chart-surface');

    const crosshair = document.createElement('div');
    crosshair.className = 'cn-chart-crosshair';
    crosshair.setAttribute('aria-hidden', 'true');

    const tooltip = document.createElement('div');
    tooltip.className = 'cn-chart-tooltip';
    tooltip.setAttribute('role', 'status');
    tooltip.setAttribute('aria-live', 'polite');

    chart.append(crosshair, tooltip);

    const getText = (event) => {
      const target = event.target instanceof Element
        ? event.target.closest('[data-value],[data-tooltip],[aria-label],title')
        : null;
      if (!target) return '当前位置';
      return target.getAttribute('data-tooltip')
        || target.getAttribute('data-value')
        || target.getAttribute('aria-label')
        || target.getAttribute('title')
        || '当前位置';
    };

    chart.addEventListener('pointermove', (event) => {
      const rect = chart.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
      chart.style.setProperty('--cn-chart-x', x + 'px');
      chart.style.setProperty('--cn-chart-y', y + 'px');
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
      tooltip.textContent = getText(event);
      chart.classList.add('is-hovering');
    });

    chart.addEventListener('pointerleave', () => {
      chart.classList.remove('is-hovering');
    });
  }

  function enhance(rootNode = document) {
    rootNode.querySelectorAll(chartSelector).forEach(ensureChartOverlay);

    rootNode.querySelectorAll(
      '.profile-row,.candidate-card,.holding-person-card,.balanced-member,.trade-item,.doc-item,.event,.group-card,.custom-group,.detail-box,.fr70-stat'
    ).forEach((el) => {
      el.setAttribute('data-cn-hoverable', 'true');
    });

    rootNode.querySelectorAll('button[title], [data-tooltip]').forEach((el) => {
      if (!el.getAttribute('aria-label') && el.getAttribute('title')) {
        el.setAttribute('aria-label', el.getAttribute('title'));
      }
    });
  }

  function boot() {
    enhance();

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches?.(chartSelector)) ensureChartOverlay(node);
          enhance(node);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
