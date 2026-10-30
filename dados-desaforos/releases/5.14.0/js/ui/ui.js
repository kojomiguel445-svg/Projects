/* Utilidades de interface: telas, modais, avisos e ícones. */
(() => {
  const U = E.U;
  const UI = {};

  UI.root = () => document.getElementById('ui');

  // ---------- avisos ----------
  UI.toast = (text, kind = '') => {
    const host = document.getElementById('toasts');
    const el = U.h(`<div class="toast ${kind}">${text}</div>`);
    host.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  };
  UI.loot = (icon, text) => {
    let host = document.querySelector('.loot-feed');
    if (!host) { host = U.h('<div class="loot-feed"></div>'); document.body.appendChild(host); }
    const el = U.h(`<div class="loot"><span class="li">${icon}</span><span>${text}</span></div>`);
    host.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  };

  // ---------- modais ----------
  // Saída suave: um retrato estático some no lugar da tela, que já foi removida de verdade
  // (o jogo e os seletores nunca encontram uma tela "fechando").
  const leave = (node, rename) => {
    if (!node.parentNode || document.body.classList.contains('reduced')) return;
    const ghost = node.cloneNode(true);
    ghost.removeAttribute('id'); ghost.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    if (rename) ghost.classList.replace(rename[0], rename[1]);
    const from = node.querySelectorAll('canvas'), to = ghost.querySelectorAll('canvas');
    from.forEach((c, i) => { try { to[i].getContext('2d').drawImage(c, 0, 0); } catch { /* WebGL: fica em branco por 0,2 s */ } });
    ghost.classList.add('ui-leave'); ghost.setAttribute('aria-hidden', 'true'); ghost.inert = true;
    node.parentNode.insertBefore(ghost, node);
    setTimeout(() => ghost.remove(), 220);
  };
  UI.modal = ({ title, text = '', html = '', buttons = [], dismiss = true, cls = '' }) => new Promise((resolve) => {
    const bg = U.h(`<div class="modal-bg"><div class="modal ${cls}"><h3>${title || ''}</h3>${text ? `<div class="sub">${text}</div>` : ''}<div class="mbody">${html}</div><div class="row"></div></div></div>`);
    const row = bg.querySelector('.row');
    const close = (v) => { leave(bg, ['modal-bg', 'modal-bg-leave']); bg.remove(); resolve(v); };
    buttons.forEach((b) => {
      const el = U.h(`<button class="btn ${b.cls || ''}"><span class="ico">${b.icon || (b.cls === 'primary' ? '✓' : '✕')}</span>${b.label}</button>`);
      el.onclick = () => { E.Audio.sfx('click'); close(b.value !== undefined ? b.value : b.label); };
      row.appendChild(el);
    });
    if (dismiss) { bg.dataset.dismiss = '1'; bg.addEventListener('pointerdown', (e) => { if (e.target === bg) close(null); }); }
    document.body.appendChild(bg);
    UI._modalBody = bg.querySelector('.mbody');
    UI._modalClose = close;
  });
  UI.confirm = (title, text, ok = 'Confirmar', cancel = 'Cancelar') => UI.modal({ title, text, buttons: [{ label: cancel, value: false }, { label: ok, value: true, cls: 'primary' }] });
  UI.alert = (title, text, ok = 'Entendi') => UI.modal({ title, text, buttons: [{ label: ok, value: true, cls: 'primary' }] });
  // lista de escolhas (usada no combate para "Golpe Divino", etc.)
  UI.choose = ({ title, text, options }) => new Promise((resolve) => {
    const bg = U.h(`<div class="modal-bg"><div class="modal"><h3>${title}</h3><div class="sub">${text || ''}</div><div class="opts"></div></div></div>`);
    const box = bg.querySelector('.opts');
    options.forEach((o, i) => {
      const el = U.h(`<button class="btn ${i === 0 ? 'primary' : 'dark'} block"><span class="ico">${o.icon || (i === options.length - 1 && o.id === 'no' ? '✕' : '✦')}</span>${o.label}</button>`);
      el.onclick = () => { bg.remove(); resolve(o.id); };
      box.appendChild(el);
    });
    document.body.appendChild(bg);
  });

  // ---------- telas ----------
  let stack = [];
  UI.open = (el, onClose) => {
    if(E.WorldServices&&E.WorldServices.active)E.WorldServices.close();
    UI.root().appendChild(el);
    stack.push({ el, onClose });
    E.Audio.sfx('open');
    U.emit('ui:screen', stack.length);
    return el;
  };
  UI.close = (el) => {
    const i = stack.findIndex((s) => s.el === el);
    if (i < 0) return;
    const [s] = stack.splice(i, 1);
    leave(s.el);
    s.el.remove();
    if (s.onClose) s.onClose();
    U.emit('ui:screen', stack.length);
  };
  UI.closeAll = () => { while (stack.length) UI.close(stack[stack.length - 1].el); };
  UI.anyOpen = () => stack.length > 0;
  addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && stack.length) { e.preventDefault(); const top = stack[stack.length - 1]; if (!top.el.dataset.noesc) UI.close(top.el); }
  });

  // Cabeçalho padrão de tela
  UI.screen = (title, { paper = true, cls = '', right = '' } = {}) => {
    const el = U.h(`<section class="screen ${paper ? 'paper' : ''} ${cls}"><header class="screen-head"><h2>${title}</h2><div class="grow"></div>${right}<button class="close" aria-label="Fechar">✕</button></header><div class="screen-body"></div></section>`);
    el.querySelector('.close').onclick = () => UI.close(el);
    return el;
  };

  // ---------- ícones (SVG simples) ----------
  const ic = (p, vb = 24) => `<svg viewBox="0 0 ${vb} ${vb}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  UI.ICONS = {
    wish: ic('<path d="M12 2l2.6 6.3L21 9l-5 4.4L17.5 20 12 16.6 6.5 20 8 13.4 3 9l6.4-.7z"/>'),
    quest: ic('<path d="M5 4h11l3 3v13H5z"/><path d="M9 9h6M9 13h6M9 17h4"/>'),
    map: ic('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
    menu: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    bag: ic('<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 016 0v2"/>'),
    // ícones do HUD em SVG: no celular os emojis do sistema saíam dos botões (tamanhos e alinhamentos diferentes em cada aparelho)
    globe: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3.2 3.2 14.8 0 18M12 3c-3.2 3.2-3.2 14.8 0 18"/>'),
    jump: ic('<path d="M12 21V8M6.5 13.5L12 8l5.5 5.5"/><path d="M5 4h14"/>'),
    hand: ic('<path d="M8 13V5.5a1.5 1.5 0 013 0V11M11 10V4.5a1.5 1.5 0 013 0V11M14 10.5V6a1.5 1.5 0 013 0v7.5c0 4-2.6 6.5-6 6.5-2.6 0-4.3-1.3-5.6-3.6L3.3 13a1.5 1.5 0 012.5-1.6L8 14"/>'),
    chat: ic('<path d="M4 5h16v11H9.5L5 20v-4H4z"/><path d="M8 9h8M8 12.5h5"/>'),
    chest: ic('<path d="M3 11h18v9H3z"/><path d="M3 11a5 5 0 015-5h8a5 5 0 015 5"/><path d="M10.5 12.5h3v3.5h-3z"/>'),
    leaf: ic('<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19l8-8"/>'),
    spark: ic('<path d="M12 2.5l2.2 7.3 7.3 2.2-7.3 2.2-2.2 7.3-2.2-7.3L2.5 12l7.3-2.2z"/>'),
    skull: ic('<path d="M12 3c-4.6 0-8 3.2-8 7.6 0 2.4 1.1 4.1 3 5.1V20h10v-4.3c1.9-1 3-2.7 3-5.1C20 6.2 16.6 3 12 3z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/><path d="M10.5 20v-2.5M13.5 20v-2.5"/>'),
    scales: ic('<path d="M12 3v17M7.5 20.5h9M4.5 6.5h15"/><path d="M4.5 6.5L2 12.5a2.6 2.6 0 005 0zM19.5 6.5L17 12.5a2.6 2.6 0 005 0z"/>'),
    fish: ic('<path d="M2.5 12c3-4.2 8.5-5.2 12.5-2l5-3v10l-5-3c-4 3.2-9.5 2.2-12.5-2z"/><circle cx="7.5" cy="11.2" r=".9"/>'),
    pick: ic('<path d="M3 8.5c5-5 13-5 18 0"/><path d="M13.5 6L6 21"/>'),
    door: ic('<path d="M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16"/><path d="M3 21h18"/><circle cx="14.5" cy="12" r=".9"/>'),
    eye: ic('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    search: ic('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l6 6"/>'),
  };
  // Uma única direção de arte no HUD, menus e interações.
  for (const [key, art] of Object.entries({wish:'oracle', quest:'quest', map:'map', menu:'character', bag:'inventory', globe:'adventure', jump:'arrow-up', hand:'hand', chat:'chat', chest:'chest', leaf:'herb', spark:'spark', skull:'skull', scales:'scales', fish:'fish', pick:'pickaxe', door:'door', eye:'eye', search:'search'})) UI.ICONS[key] = E.Icons.html(art, {decorative:true});
  // ícone de cada tipo de interação (prompt e botão de mão)
  UI.iaIcon = (it) => {
    const k = it && it.kind;
    const I = UI.ICONS;
    return { npc: I.chat, chest: I.chest, herb: I.leaf, waypoint: I.spark, story: I.spark, lair: I.skull, trade: I.scales, fish: I.fish, ore: I.pick, building: I.door, landmark: I.eye, qinvestigate: I.search }[k] || (it ? `<span class="emo">${it.icon || '✋'}</span>` : I.hand);
  };
  UI.signed = (n) => (n >= 0 ? '+' + n : '−' + Math.abs(n));
  UI.heroPortrait = (h) => E.SP.portrait(E.SP.hero(h, 'idle0', E.SP.heroWeaponType(h)), 3);

  E.UI = UI;
})();
