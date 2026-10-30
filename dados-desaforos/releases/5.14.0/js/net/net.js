/* Cliente de rede: contas, salvamento na nuvem e conexão online (WebSocket) com o servidor do jogo. */
(() => {
  const U = E.U;
  const KEY = 'elarion-net';
  const NET = { token: null, user: null, ws: null, connected: false, me: null, uid: null, players: new Map(), party: { id: null, members: [] }, server: '', policy: 'approve' };

  const stored = U.load(KEY, {});
  NET.token = stored.token || null; NET.user = stored.user || null; NET.server = stored.server || '';
  const persist = () => U.save(KEY, { token: NET.token, user: NET.user, server: NET.server });

  // endereço do servidor: configurado pelo jogador ou o próprio site (quando aberto por http/https)
  NET.base = () => {
    if (NET.server) {
      const configured = NET.server.replace(/\/+$/, '');
      if (!(E.Hosting && E.Hosting.static && configured === location.origin)) return configured;
    }
    if (E.Hosting && E.Hosting.static) return '';
    if (/^https?:$/.test(location.protocol) && !/claude\.ai|claudeusercontent/.test(location.host)) return location.origin;
    return '';
  };
  NET.available = () => !!NET.base();
  NET.setServer = (url) => { NET.server = (url || '').trim(); persist(); };

  NET.api = async (path, { method = 'GET', body } = {}) => {
    const base = NET.base();
    if (!base) throw new Error('Nenhum servidor configurado.');
    let res;
    try {
      res = await fetch(base + path, { method, headers: Object.assign({ 'content-type': 'application/json' }, NET.token ? { authorization: 'Bearer ' + NET.token } : {}), body: body ? JSON.stringify(body) : undefined });
    } catch (e) { throw new Error('Não foi possível falar com o servidor. Ele está ligado?'); }
    let data = {}; try { data = await res.json(); } catch { /* */ }
    if (!res.ok) { if (res.status === 401 && NET.token && path !== '/api/login') { NET.token = null; NET.user = null; persist(); } throw new Error(data.error || `Erro ${res.status}`); }
    return data;
  };
  NET.status = () => NET.api('/api/status');
  const auth = async (path, name, password) => {
    const d = await NET.api(path, { method: 'POST', body: { name, password } });
    NET.token = d.token; NET.user = d.user; persist();
    U.emit('net:auth', NET.user);
    return d.user;
  };
  NET.register = (n, p) => auth('/api/register', n, p);
  NET.login = (n, p) => auth('/api/login', n, p);
  NET.logout = async () => { try { await NET.api('/api/logout', { method: 'POST' }); } catch { /* */ } NET.disconnect(); NET.token = null; NET.user = null; persist(); U.emit('net:auth', null); };
  NET.cloudSave = async () => { E.Store.save(); const d = await NET.api('/api/save', { method: 'PUT', body: { save: E.Store.exportSave() } }); NET.lastCloud = Date.now(); return d.saveAt; };
  NET.cloudInfo = () => NET.api('/api/save');
  NET.cloudLoad = async () => { const d = await NET.api('/api/save'); if (!d.save) throw new Error('Ainda não há salvamento na nuvem.'); E.Store.importSave(d.save); return true; };
  // perfil, amigos e correio
  NET.me_ = () => NET.api('/api/me');
  NET.setProfile = (data) => NET.api('/api/profile', { method: 'PUT', body: data }).then((d) => { NET.user = d.user; persist(); return d.user; });
  NET.changePassword = (old, password) => NET.api('/api/password', { method: 'POST', body: { old, password } });
  NET.userByUid = (uid) => NET.api('/api/user/' + encodeURIComponent(uid)).then((d) => d.user);
  NET.friends = () => NET.api('/api/friends');
  NET.friendOp = (op, uid) => NET.api('/api/friends/' + op, { method: 'POST', body: { uid: Number(uid) } });
  NET.mail = () => NET.api('/api/mail').then((d) => d.mail);
  NET.claimMail = (id) => NET.api('/api/mail/claim', { method: 'POST', body: { id } });
  // lista de quem está online agora (pela conexão)
  let onlineWait = null;
  NET.onlineList = () => new Promise((resolve) => { if (!NET.connected) return resolve([]); onlineWait = resolve; NET.send({ t: 'online' }); setTimeout(() => { if (onlineWait === resolve) { onlineWait = null; resolve([]); } }, 4000); });

  // ------------------------------------------------------------ WebSocket
  let retry = 0, retryTimer = null, wantOnline = false, posTimer = null, pingTimer = null, lastPos = '';
  NET.heroSummary = () => {
    const h = E.Store.hero(); if (!h) return null;
    const wi = E.SP.heroWeaponInfo(h);
    return { name: h.name, cls: h.cls, species: h.species, level: h.level, title: E.Life ? E.Life.title(h) : '', look: E.CH.normalize(h.look, h.cls, h.species), weapon: Object.assign({}, wi, { type: E.Zones ? E.Zones.weaponType(h) : E.SP.heroWeaponType(h) }), sheathed: !!(E.Zones && E.Zones.safe) };
  };
  NET.send = (obj) => { if (NET.ws && NET.ws.readyState === 1) NET.ws.send(JSON.stringify(obj)); };
  NET.hello = () => { const hero = NET.heroSummary(); if (!hero) return; const w = E.WG.world; NET.send({ t: 'hello', hero, profile: E.Adv ? E.Adv.summary() : {}, region: w ? w.id : E.state.world.region, x: w ? w.hero.x : 0, z: w ? w.hero.z : 0 }); };
  NET.connect = () => {
    if (!NET.token || !NET.available() || !NET.isActiveAccount()) return false;
    wantOnline = true;
    if (NET.ws && NET.ws.readyState <= 1) return true;
    const url = NET.base().replace(/^http/, 'ws') + '/ws?token=' + encodeURIComponent(NET.token);
    let ws;
    try { ws = new WebSocket(url); } catch (e) { return false; }
    NET.ws = ws;
    ws.onopen = () => { retry = 0; NET.connected = true; NET.hello(); U.emit('net:status', true); };
    ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; } handle(m); };
    ws.onclose = () => {
      const was = NET.connected; NET.connected = false; NET.ws = null; NET.players.clear(); NET.party = { id: null, members: [] };
      if (E.CoopWorld && E.CoopWorld.guest) E.CoopWorld.exit('A conexão caiu: de volta ao seu mundo.');
      U.emit('net:status', false);
      if (was) E.UI.toast('🌐 Desconectado do servidor.');
      if (wantOnline && NET.token) { clearTimeout(retryTimer); retryTimer = setTimeout(NET.connect, Math.min(30000, 1500 * 2 ** retry++)); }
    };
    ws.onerror = () => { /* onclose cuida da reconexão */ };
    clearInterval(posTimer); posTimer = setInterval(sendPos, 120);
    clearInterval(pingTimer); pingTimer = setInterval(() => NET.send({ t: 'ping', at: Date.now() }), 25000);
    return true;
  };
  NET.disconnect = () => { wantOnline = false; clearTimeout(retryTimer); clearInterval(posTimer); clearInterval(pingTimer); if (NET.ws) try { NET.ws.close(); } catch { /* */ } };
  const sendPos = () => {
    const w = E.WG.world; if (!NET.connected || !w || !NET.me) return;
    const hr = w.hero;
    const s = `${w.id}|${hr.x.toFixed(1)}|${hr.z.toFixed(1)}|${hr.dir}|${hr.moving ? 1 : 0}`;
    if (s === lastPos) return;
    lastPos = s;
    NET.send({ t: 'pos', r: w.id, x: +hr.x.toFixed(2), z: +hr.z.toFixed(2), d: hr.dir, m: hr.moving ? 1 : 0, j: +hr.jump.toFixed(2), vy: Math.round(hr.vy) });
  };
  function handle(m) {
    switch (m.t) {
      case 'welcome': NET.me = m.you; NET.uid = m.uid; NET.policy = m.policy || 'approve'; NET.players.clear(); E.UI.toast(`🌐 Online como ${U.esc(m.name)} (UID ${m.uid}) · ${m.online} jogador(es) conectado(s)`, 'gold'); break;
      // mundos (cooperativo): os jogadores conhecidos são os do mesmo mundo
      case 'wenter': NET.players.clear(); for (const p of m.members) NET.players.set(p.id, p); if (E.CoopWorld) E.CoopWorld.enter(m); break;
      case 'wjoin': NET.players.set(m.p.id, m.p); E.UI.toast(`🤝 ${U.esc(m.p.name)} entrou no ${E.CoopWorld && E.CoopWorld.guest ? 'mundo' : 'seu mundo'}!`, 'gold'); if (E.CoopWorld) E.CoopWorld.broadcastState(); break;
      case 'wleft': NET.players.delete(m.id); E.UI.toast(`🚪 ${U.esc(m.reason || m.name + ' saiu.')}`); break;
      case 'wexit': NET.players.clear(); if (E.CoopWorld) E.CoopWorld.exit(m.reason); break;
      case 'wreq': if (E.CoopWorld) E.CoopWorld.onRequest(m.from); break;
      case 'wres': if (!m.ok) E.UI.toast('🚫 ' + U.esc(m.reason || 'Pedido recusado.')); break;
      case 'wstate': if (E.CoopWorld) E.CoopWorld.applyState(m.state); break;
      case 'wact': if (E.CoopWorld) E.CoopWorld.onAct(m); break;
      case 'online': if (onlineWait) { const f = onlineWait; onlineWait = null; f(m.list || []); } break;
      case 'freq': E.UI.toast(`👤 ${U.esc(m.from.name)} (UID ${m.from.uid}) quer ser seu amigo — veja em Cooperativo.`, 'gold'); break;
      case 'fnew': E.UI.toast(`🤝 Agora você e ${U.esc(m.friend.name)} são amigos!`, 'gold'); break;
      case 'fstatus': E.UI.toast(`${m.online ? '🟢' : '⚪'} ${U.esc(m.name)} ${m.online ? 'ficou online' : 'saiu'}`); break;
      case 'hero': { const p = NET.players.get(m.id); if (p) { p.hero = m.hero; if (m.profile) p.profile = m.profile; } break; }
      case 'region': { const p = NET.players.get(m.id); if (p) Object.assign(p, { region: m.region, x: m.x, z: m.z }); break; }
      case 'pos': { const p = NET.players.get(m.id); if (p) Object.assign(p, { x: m.x, z: m.z, d: m.d, m: m.m, j: m.j || 0, vy: m.vy || 0 }); break; }
      case 'party': NET.party = { id: m.id, members: m.members || [] }; for (const mm of NET.party.members) if (NET.players.has(mm.id)) NET.players.get(mm.id).party = m.id; break;
      case 'kicked': wantOnline = false; E.UI.alert('Conexão encerrada', m.reason); break;
      case 'notice': E.UI.toast(U.esc(m.text)); break;
    }
    U.emit('net:msg', m);
  }
  NET.inParty = (id) => NET.party.members.some((x) => x.id === id);
  NET.partyHere = () => { const w = E.WG.world; return NET.party.members.filter((x) => x.id !== NET.me && NET.players.get(x.id) && NET.players.get(x.id).region === (w && w.id)); };

  // salvamento automático na nuvem a cada 3 minutos (se logado)
  // (só quando a conta em uso neste aparelho é esta conta online)
  NET.isActiveAccount = () => { const a = E.Acc && E.Acc.current(); return !!(NET.user && a && a.kind === 'cloud' && a.id === 'C' + NET.user.uid); };
  setInterval(() => { if (NET.token && NET.available() && NET.isActiveAccount() && E.Store.hero() && Date.now() - (NET.lastCloud || 0) > 170e3) NET.cloudSave().catch(() => {}); }, 60e3);
  addEventListener('visibilitychange', () => { if (document.hidden && NET.token && NET.available() && NET.isActiveAccount() && E.Store.hero()) NET.cloudSave().catch(() => {}); });

  E.Net = NET;
})();
