/* Elarion — ícones vetoriais locais, independentes das fontes de emoji do aparelho. */
(() => {
  'use strict';
  const catalog = E.IconCatalog || {};
  if (catalog.spark) document.documentElement.style.setProperty('--el-icon-spark', `url("${catalog.spark.src}")`);
  const aliases = Object.assign({}, E.IconAliases || {});
  const cache = new Map();
  const entries = new Map();
  const escape = E.U.esc;
  const ignored = 'script,style,textarea,input,select,option,svg,canvas,[contenteditable]:not([contenteditable="false"]),[data-icon-text],[data-icon]';

  // Android, Windows e os dados antigos nem sempre usam o seletor de apresentação.
  for (const [symbol, key] of Object.entries(aliases)) {
    const base = symbol.replace(/\uFE0F/g, '');
    if (!aliases[base]) aliases[base] = key;
    if (!symbol.includes('\u200D') && !aliases[base + '\uFE0F']) aliases[base + '\uFE0F'] = key;
  }
  const tokens = Object.keys(aliases).filter(Boolean).sort((a, b) => b.length - a.length);
  const pattern = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const matcher = () => new RegExp(pattern || '(?!)', 'gu');
  const detect = new RegExp(pattern || '(?!)', 'u');

  const get = (value) => {
    const key = Object.prototype.hasOwnProperty.call(catalog, value) ? value : aliases[value];
    if (!key || !Object.prototype.hasOwnProperty.call(catalog, key)) return null;
    if (!entries.has(key)) entries.set(key, Object.assign({ key }, catalog[key]));
    return entries.get(key);
  };

  const makeImage = (entry, decorative = false, className = '') => {
    const img = document.createElement('img');
    img.className = ('el-icon ' + className).trim();
    img.src = entry.src;
    img.alt = decorative ? '' : entry.label;
    if (decorative) img.setAttribute('aria-hidden', 'true');
    img.draggable = false;
    img.width = 64;
    img.height = 64;
    img.dataset.icon = entry.key;
    return img;
  };

  const html = (value, { decorative = false, className = '' } = {}) => {
    const entry = get(value);
    if (!entry) return escape(value || '');
    return `<img class="${escape(('el-icon ' + className).trim())}" src="${escape(entry.src)}" alt="${decorative ? '' : escape(entry.label)}"${decorative ? ' aria-hidden="true"' : ''} draggable="false" data-icon="${escape(entry.key)}" width="64" height="64">`;
  };

  const plain = (value) => String(value ?? '').replace(matcher(), (symbol) => {
    const entry = get(symbol);
    return entry ? entry.label : symbol;
  });

  const skipped = (node) => {
    const parent = node.nodeType === 1 ? node : node.parentElement;
    return !parent || !!parent.closest(ignored);
  };

  const replaceText = (node) => {
    const value = node.nodeValue;
    if (!value || !detect.test(value) || skipped(node)) return;
    const fragment = document.createDocumentFragment();
    let end = 0;
    for (const match of value.matchAll(matcher())) {
      const entry = get(match[0]);
      if (!entry) continue;
      if (match.index > end) fragment.appendChild(document.createTextNode(value.slice(end, match.index)));
      fragment.appendChild(makeImage(entry));
      end = match.index + match[0].length;
    }
    if (!end) return;
    if (end < value.length) fragment.appendChild(document.createTextNode(value.slice(end)));
    node.replaceWith(fragment);
  };

  const hydrate = (root) => {
    if (!root) return root;
    if (root.nodeType === 3) { replaceText(root); return root; }
    if (root.nodeType !== 1 && root.nodeType !== 11 && root.nodeType !== 9) return root;
    if (root.nodeType === 1 && skipped(root)) return root;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType === 1) return node.matches(ignored) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
        return detect.test(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
    // Materializar a lista evita invalidar o percurso ao substituir cada nó.
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) replaceText(node);
    return root;
  };

  const imageFor = (value) => {
    const entry = get(value);
    if (!entry) return null;
    if (!cache.has(entry.key)) {
      const img = new Image();
      const record = { img, loaded: false, callbacks: new Set(), ready: null };
      record.ready = new Promise((resolve) => {
        img.onload = () => {
          record.loaded = true;
          for (const callback of record.callbacks) callback();
          record.callbacks.clear();
          resolve(img);
        };
        img.onerror = () => { record.callbacks.clear(); resolve(null); };
      });
      cache.set(entry.key, record);
      img.src = entry.src;
    }
    return cache.get(entry.key);
  };

  // onLoad permite atualizar CanvasTexture.needsUpdate sem esperar pelo próximo frame.
  const paint = (ctx, value, x, y, size, onLoad) => {
    const record = imageFor(value);
    if (!record) return false;
    const draw = () => {
      ctx.drawImage(record.img, x, y, size, size);
      if (onLoad) onLoad();
    };
    if (record.loaded) { draw(); return true; }
    record.callbacks.add(draw);
    return false;
  };

  let observer = null;
  const observe = (root = document.body) => {
    if (!root || typeof MutationObserver === 'undefined') return;
    if (observer) observer.disconnect();
    hydrate(root);
    observer = new MutationObserver((records) => {
      const roots = new Set();
      for (const record of records) {
        if (record.type === 'characterData') {
          if (record.target.isConnected && detect.test(record.target.nodeValue || '')) roots.add(record.target);
        } else {
          for (const node of record.addedNodes) {
            if (!node.isConnected || (node.nodeType !== 1 && node.nodeType !== 3)) continue;
            if (node.nodeType === 3 && !detect.test(node.nodeValue || '')) continue;
            if (!skipped(node)) roots.add(node);
          }
        }
      }
      // Se um container e um descendente mudaram juntos, percorre só o container.
      for (const node of roots) {
        let parent = node.parentNode;
        while (parent && !roots.has(parent)) parent = parent.parentNode;
        if (!parent) hydrate(node);
      }
    });
    observer.observe(root, { subtree: true, childList: true, characterData: true });
  };

  E.Icons = {
    get, html, plain, hydrate, paint, observe,
    src: (value) => { const entry = get(value); return entry ? entry.src : ''; },
    preload: () => Promise.all(Object.keys(catalog).map((key) => imageFor(key).ready)),
    tokens: Object.freeze(tokens.slice()),
  };
  if (document.body) observe(document.body);
  else document.addEventListener('DOMContentLoaded', () => observe(document.body), { once: true });
})();
