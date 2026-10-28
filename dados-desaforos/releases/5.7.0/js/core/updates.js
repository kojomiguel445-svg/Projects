/* Safe PWA updates: never reset a save or reload during a battle/transaction. */
(() => {
  'use strict';
  const X = { available: false, release: null }, currentRelease = () => E.Title && E.Title.VERSION || document.querySelector('meta[name="elarion-release"]')?.content;
  const newer = (next, current) => {
    if (!/^\d+\.\d+\.\d+$/.test(next || '') || !/^\d+\.\d+\.\d+$/.test(current || '')) return false;
    const a = next.split('.').map(Number), b = current.split('.').map(Number);
    for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];return false;
  };
  let registration, initialized = false, reloadStarted = false, checkingAt = 0, banner, poll;
  const enabled = () => 'serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !(E.App && E.App.native) && !/standalone\.html$/i.test(location.pathname);
  const busy = () => !!(document.hidden || E.BattleUI && E.BattleUI.current || E.WorldServices && E.WorldServices.active || E.UI && E.UI.anyOpen() || E.Interior && E.Interior.current && (E.Interior.current.edit || E.Interior.current.sleeping) || document.querySelector('.modal-bg,#dialog,.wish-anim,.reveal,.summary,.death-roll') || E.WG && E.WG.mode && E.WG.mode() === 'arena');
  X.safeToReload = () => !busy();
  const versionOf = worker => new Promise(resolve => {
    if (!worker || typeof MessageChannel === 'undefined') return resolve(null);
    const channel = new MessageChannel(), timer = setTimeout(() => { channel.port1.close();resolve(null); }, 1800);
    channel.port1.onmessage = event => { clearTimeout(timer);channel.port1.close();resolve(event.data && event.data.release || null); };
    try { worker.postMessage({ type: 'ELARION_GET_RELEASE' }, [channel.port2]); } catch { clearTimeout(timer);resolve(null); }
  });
  function status() {
    if (!banner) return;const button = banner.querySelector('button');button.disabled = busy();
    button.textContent = button.disabled ? 'Conclua a ação para atualizar' : 'Salvar e atualizar';
  }
  X.apply = () => {
    if (!X.available || reloadStarted || busy()) return false;
    try {
      if (E.Store && E.Store.data) {
        E.Store.save();const key = E.Acc ? E.Acc.saveKey() : 'elarion-save-v1';
        if (localStorage.getItem(key) !== JSON.stringify(E.Store.data)) throw new Error('Save did not persist');
      }
      sessionStorage.setItem('elarion-last-auto-update', X.release || 'latest');
    } catch {
      if (banner) banner.querySelector('span').textContent = 'Não foi possível salvar. Libere espaço no navegador antes de atualizar.';
      return false;
    }
    reloadStarted = true;if (poll) clearInterval(poll);
    if (registration && registration.waiting) registration.waiting.postMessage({ type: 'ELARION_ACTIVATE_UPDATE' });
    const target = new URL(location.href);
    if (X.release && (E.Hosting && E.Hosting.static || target.pathname.startsWith('/releases/'))) target.pathname = '/releases/' + encodeURIComponent(X.release) + '/index.html';
    target.searchParams.set('v', X.release || 'latest');location.replace(target.href);return true;
  };
  function offer(release) {
    if (!newer(release, currentRelease()) || reloadStarted) return;X.release = release;X.available = true;
    if (!banner) {
      banner = document.createElement('aside');banner.className = 'elarion-update';banner.setAttribute('role', 'status');banner.setAttribute('aria-live', 'polite');
      banner.style.cssText = 'position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:95;box-sizing:border-box;width:min(350px,calc(100vw - 28px));padding:12px;border:2px solid #cfb371;background:#203a45;color:#f4e7c7;box-shadow:3px 3px #10222b;display:flex;align-items:center;gap:10px;font:12px var(--ui,sans-serif);line-height:1.5;pointer-events:auto';
      const text = document.createElement('span'), button = document.createElement('button');button.className = 'btn sm primary';button.style.cssText = 'flex:none;max-width:150px;font-size:11px';button.onclick = X.apply;banner.append(text, button);document.body.appendChild(banner);poll = setInterval(status, 800);
    }
    banner.querySelector('span').textContent = 'Elarion ' + release + ' está pronto. Seu progresso será preservado.';status();
    let last = '';try { last = sessionStorage.getItem('elarion-last-auto-update'); } catch { /* manual update remains available */ }
    if (last !== release && document.getElementById('title') && E.WG && E.WG.mode() === 'title' && !busy()) X.apply();
  }
  X.check = async (force = false) => {
    if (!registration || document.hidden || !navigator.onLine) return false;
    if (!force && Date.now() - checkingAt < 60000) return false;checkingAt = Date.now();
    try { await registration.update();if (registration.waiting) offer(await versionOf(registration.waiting));return true; } catch { return false; }
  };
  X.init = () => {
    if (initialized || !enabled()) return false;initialized = true;
    navigator.serviceWorker.addEventListener('controllerchange', async () => offer(await versionOf(navigator.serviceWorker.controller)));
    navigator.serviceWorker.addEventListener('message', event => { if (event.data && event.data.type === 'ELARION_RELEASE_READY') offer(event.data.release); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) X.check(); });addEventListener('online', () => X.check(true));
    navigator.serviceWorker.register(new URL('/sw.js', location.href).href, { scope: '/', updateViaCache: 'none' }).then(async reg => {
      registration = reg;
      reg.addEventListener('updatefound', () => { const worker = reg.installing;if (worker) worker.addEventListener('statechange', async () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(await versionOf(worker)); }); });
      if (reg.waiting) offer(await versionOf(reg.waiting));if (navigator.serviceWorker.controller) offer(await versionOf(navigator.serviceWorker.controller));X.check(true);
    }).catch(() => { /* a previously loaded offline game remains playable */ });return true;
  };
  E.Updates = X;
})();
