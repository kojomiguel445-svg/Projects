/* Interface do modo online: conta, jogadores e grupo, chat/emotes e os outros jogadores andando no mundo. */
(() => {
  const U = E.U, UI = E.UI;
  const ON = {};
  const NET = () => E.Net;
  const EMOTES = ['👋', '😂', '❤️', '⚔️', '🎉', '😱', '👍', '🙏'];
  const bubbles = new Map(); // id → { e, until }
  let chatEl = null;
  const chatLog = [];

  // ------------------------------------------------------------ conta (local, online ou convidado)
  const field = (attrs) => `<input class="field" ${attrs}>`;
  ON.openAccount = async (opts = {}) => {
    const net = NET(), A = E.Acc;
    const el = UI.screen('👤 Conta', { paper: true });
    const body = el.querySelector('.screen-body');
    let tab = opts.tab || (net.user && A.current() && A.current().kind === 'cloud' ? 'online' : 'local');
    const draw = async () => {
      const cur = A.current();
      body.innerHTML = `<div class="acc-wrap">
        <div class="acc-cur">${cur ? `<div class="ac-av">${cur.kind === 'cloud' ? '☁' : '💾'}</div><div><b>${U.esc(cur.name)}</b><small>${cur.kind === 'cloud' ? 'Conta online' : 'Conta local'} · UID ${U.esc(cur.uid || E.state.uid)}</small></div>` : `<div class="ac-av">👤</div><div><b>Convidado</b><small>Sem conta — o progresso fica só neste aparelho.</small></div>`}</div>
        <div class="acc-tabs"><button data-t="local" class="${tab === 'local' ? 'on' : ''}">💾 Conta local</button><button data-t="online" class="${tab === 'online' ? 'on' : ''}">☁ Conta online</button></div>
        <div class="acc-body"></div>
        <div class="acc-foot">${cur ? '<button class="btn sm dark" data-a="logout"><span class="ico">⏻</span>Sair da conta</button>' : ''}${!cur && !A.data.chosen ? '<button class="btn sm dark" data-a="guest"><span class="ico">▶</span>Jogar sem conta</button>' : ''}</div></div>`;
      body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); }));
      const lo = body.querySelector('[data-a=logout]');
      if (lo) lo.onclick = async () => { if (!(await UI.confirm('Sair da conta?', 'O progresso desta conta fica salvo. O jogo volta para a tela inicial.', 'Sair'))) return; if (cur.kind === 'cloud') { try { await net.cloudSave(); } catch { /* */ } await net.logout(); } A.logout(); A.restart(); };
      const gb = body.querySelector('[data-a=guest]');
      if (gb) gb.onclick = () => { A.playAsGuest(); UI.close(el); if (opts.onDone) opts.onDone(); };
      const box = body.querySelector('.acc-body');
      if (tab === 'local') drawLocal(box, cur, draw); else drawOnline(box, cur, draw);
    };
    // ---- contas locais: ficam neste aparelho, com senha
    const drawLocal = (box, cur, redraw) => {
      const A2 = E.Acc, list = A2.locals();
      box.innerHTML = `<p class="muted tr-tip">Contas locais ficam guardadas <b>neste aparelho</b> e funcionam sem internet (inclusive no app). Cada conta tem o próprio progresso.</p>
        <div class="acc-list">${list.map((a) => `<button class="acc-item ${cur && cur.id === a.id ? 'on' : ''}" data-id="${a.id}"><span class="ai-i">💾</span><span><b>${U.esc(a.name)}</b><small>UID ${a.uid} · ${A2.hasSave(a.id) ? 'com progresso' : 'nova'}</small></span>${cur && cur.id === a.id ? '<em>em uso</em>' : '<em>Entrar ›</em>'}</button>`).join('') || '<p class="muted tr-tip">Nenhuma conta local ainda.</p>'}</div>
        <div class="detail"><h4>Criar conta local</h4>${field('data-n placeholder="Nome (3 a 16 letras)" maxlength="16" autocomplete="username"')}${field('data-p type="password" placeholder="Senha (mín. 4)" autocomplete="new-password" style="margin-top:8px"')}${field('data-p2 type="password" placeholder="Repita a senha" autocomplete="new-password" style="margin-top:8px"')}
        ${!cur && E.Store.hero() ? '<label class="acc-adopt"><input type="checkbox" data-adopt checked> Usar o progresso atual deste aparelho nesta conta</label>' : ''}
        <div class="cs-row" style="justify-content:flex-start"><button class="btn primary" data-a="create"><span class="ico">✦</span>Criar e entrar</button></div><p class="acc-err pl-down"></p>
        ${cur && cur.kind === 'local' ? '<button class="btn sm dark" data-a="pw" style="margin-top:6px"><span class="ico">🔑</span>Trocar a senha desta conta</button>' : ''}</div>`;
      box.querySelectorAll('.acc-item').forEach((b) => (b.onclick = async () => {
        const id = b.dataset.id; if (cur && cur.id === id) return;
        const pw = await ask('Senha da conta', 'Senha', 'password'); if (pw == null) return;
        try { await E.Acc.loginLocal(id, pw); E.Audio.sfx('levelup'); UI.toast('✦ Conta carregada!', 'gold'); E.Acc.restart(); } catch (e) { UI.toast('🚫 ' + U.esc(e.message)); }
      }));
      box.querySelector('[data-a=create]').onclick = async () => {
        const n = box.querySelector('[data-n]').value, pw = box.querySelector('[data-p]').value, pw2 = box.querySelector('[data-p2]').value;
        const err = box.querySelector('.acc-err'); err.textContent = '';
        if (pw !== pw2) { err.textContent = 'As senhas não conferem.'; return; }
        const adopt = box.querySelector('[data-adopt]');
        try { if (E.Store.data) E.Store.save(); await E.Acc.createLocal(n, pw, { adoptGuest: !!(adopt && adopt.checked) }); E.Audio.sfx('levelup'); UI.toast('✦ Conta criada!', 'gold'); E.Acc.restart(); } catch (e) { err.textContent = e.message; }
      };
      const pwb = box.querySelector('[data-a=pw]');
      if (pwb) pwb.onclick = async () => { const old = await ask('Senha atual', 'Senha atual', 'password'); if (old == null) return; const nw = await ask('Nova senha', 'Nova senha (mín. 4)', 'password'); if (!nw) return; try { await E.Acc.changeLocalPassword(old, nw); UI.toast('🔑 Senha trocada.', 'gold'); } catch (e) { UI.toast('🚫 ' + U.esc(e.message)); } };
    };
    // ---- conta online: servidor do jogo (SQLite), UID, amigos, correio e nuvem
    const drawOnline = async (box, cur, redraw) => {
      const base = net.base();
      box.innerHTML = `<p class="muted tr-tip">A conta online fica no <b>servidor do jogo</b> (banco de dados): progresso na nuvem (PC e celular), UID de jogador, amigos, correio e cooperativo. ${E.Hosting && E.Hosting.static ? 'Você pode jogar solo e salvar o progresso neste aparelho. Para contas na nuvem e cooperativo, informe o endereço de um servidor de Elarion abaixo.' : E.App.native ? 'No app, digite o endereço do servidor (ex.: <code>http://192.168.0.10:3000</code> no mesmo Wi-Fi, ou o endereço do Render).' : 'Se você abriu o jogo pelo próprio servidor, ele já é usado sozinho.'}</p>
        <div class="srv">${field(`data-srv placeholder="https://seu-elarion.onrender.com" value="${U.esc(net.server)}"`)}<button class="btn sm dark" data-a="srv">Salvar</button></div>
        <p class="muted tr-tip" data-st>Servidor: <b>${base ? U.esc(base) : 'nenhum'}</b></p><div class="acc-on"></div>`;
      box.querySelector('[data-a=srv]').onclick = () => { net.setServer(box.querySelector('[data-srv]').value); redraw(); };
      if (base) net.status().then((st) => { const e = box.querySelector('[data-st]'); if (e) e.innerHTML += ` · <span class="pl-up">● no ar</span> · ${st.online} jogando · ${st.players} contas · banco ${U.esc(st.db || 'JSON')}`; }).catch(() => { const e = box.querySelector('[data-st]'); if (e) e.innerHTML += ' · <span class="pl-down">● fora do ar</span>'; });
      const on = box.querySelector('.acc-on');
      if (!base && E.Hosting && E.Hosting.static) {
        on.innerHTML = '<div class="detail"><h4>Jogue solo em Elarion</h4><p class="muted tr-tip">O modo solo, as contas locais e o progresso neste aparelho estão disponíveis. O cooperativo e os salvamentos na nuvem precisam de um servidor de jogo configurado.</p><button class="btn primary" data-a="local-play">Usar conta local</button></div>';
        on.querySelector('[data-a=local-play]').onclick = () => { tab = 'local'; redraw(); };
        return;
      }
      if (!net.user) {
        on.innerHTML = `<div class="detail"><h4>Entrar ou criar conta online</h4>${field('data-n placeholder="Nome da conta" maxlength="16" autocomplete="username"')}${field('data-p type="password" placeholder="Senha (mín. 6)" autocomplete="current-password" style="margin-top:8px"')}<div class="cs-row" style="justify-content:flex-start"><button class="btn primary" data-a="login"><span class="ico">✓</span>Entrar</button><button class="btn dark" data-a="reg"><span class="ico">✦</span>Criar conta</button></div><p class="acc-err pl-down"></p></div>`;
        const go = async (fn) => {
          const n = on.querySelector('[data-n]').value, pw = on.querySelector('[data-p]').value;
          const err = on.querySelector('.acc-err'); err.textContent = '';
          try {
            const user = await fn(n, pw);
            const had = E.Store.data && E.Store.hero() ? E.Store.exportSave() : null;
            const acc = E.Acc.useCloud(user);
            const info = await net.cloudInfo().catch(() => ({}));
            if (info.save) E.Acc.writeSave(acc.id, decodeURIComponent(escape(atob(info.save))));
            else if (had && await UI.confirm('Conta nova na nuvem', 'Enviar o progresso deste aparelho para esta conta online?', 'Enviar', 'Começar do zero')) { E.Acc.writeSave(acc.id, decodeURIComponent(escape(atob(had)))); }
            E.Audio.sfx('levelup');
            E.Acc.restart();
          } catch (e) { err.textContent = e.message; }
        };
        on.querySelector('[data-a=login]').onclick = () => go(net.login);
        on.querySelector('[data-a=reg]').onclick = () => go(net.register);
        return;
      }
      const u = net.user;
      on.innerHTML = `<div class="detail"><h4>☁ ${U.esc(u.name)} <small style="color:#8a7a5a">UID ${u.uid}</small></h4>
        <p class="muted tr-tip">${net.connected ? '<span class="pl-up">● Conectado</span>' : '○ Desconectado'}${u.signature ? ` · “${U.esc(u.signature)}”` : ''}</p>
        <div class="cs-row" style="justify-content:flex-start;flex-wrap:wrap"></div></div><div class="mail-box"></div>`;
      const row = on.querySelector('.cs-row');
      const btn = (label, cls, fn) => { const b = U.h(`<button class="btn sm ${cls}">${label}</button>`); b.onclick = fn; row.appendChild(b); };
      if (cur && cur.kind === 'cloud') {
        if (E.Store.hero()) btn(net.connected ? 'Desconectar' : 'Conectar', 'primary', () => { if (net.connected) net.disconnect(); else net.connect(); setTimeout(redraw, 800); });
        btn('✍ Assinatura', 'dark', async () => { const t = await ask('Assinatura (aparece para os amigos)', 'Ex.: Procuro grupo para o dragão!', 'text', u.signature || ''); if (t == null) return; try { await net.setProfile({ signature: t }); redraw(); } catch (e) { UI.toast(U.esc(e.message)); } });
        btn('☁ Salvar na nuvem', 'dark', async () => { try { await net.cloudSave(); UI.toast('☁ Progresso salvo na nuvem.', 'gold'); } catch (e) { UI.toast(U.esc(e.message)); } });
        btn('⬇ Baixar da nuvem', 'dark', async () => { if (!(await UI.confirm('Baixar da nuvem?', 'O progresso deste aparelho será substituído pelo da nuvem.', 'Baixar'))) return; try { await net.cloudLoad(); E.Acc.restart(); } catch (e) { UI.toast(U.esc(e.message)); } });
        btn('🔑 Trocar senha', 'dark', async () => { const old = await ask('Senha atual', 'Senha atual', 'password'); if (old == null) return; const nw = await ask('Nova senha', 'Nova senha (mín. 6)', 'password'); if (!nw) return; try { await net.changePassword(old, nw); UI.toast('🔑 Senha trocada (outros aparelhos foram desconectados).', 'gold'); } catch (e) { UI.toast('🚫 ' + U.esc(e.message)); } });
        // correio (presentes da Guilda)
        net.mail().then((mail) => {
          const mb = on.querySelector('.mail-box'); if (!mb) return;
          mb.innerHTML = `<div class="detail"><h4>✉ Correio</h4>${mail.length ? mail.map((m) => `<div class="mail ${m.claimed ? 'done' : ''}"><div><b>${U.esc(m.title)}</b><small>${U.esc(m.body)}</small></div>${m.claimed ? '<em>Resgatado</em>' : `<button class="btn sm primary" data-mail="${m.id}">${m.gems ? m.gems + ' 💎 ' : ''}${m.gold ? m.gold + ' 🪙' : ''} Resgatar</button>`}</div>`).join('') : '<p class="muted tr-tip">Sem correspondência.</p>'}</div>`;
          mb.querySelectorAll('[data-mail]').forEach((b) => (b.onclick = async () => { try { const r = await net.claimMail(Number(b.dataset.mail)); E.state.gems += r.gems || 0; const h = E.Store.hero(); if (h) h.gold += r.gold || 0; E.Store.save(); E.HUD.update && E.HUD.update(); UI.loot('💎', `${r.gems || 0} Gemas Estelares`); if (r.gold) UI.loot('🪙', `${r.gold} po`); redraw(); } catch (e) { UI.toast(U.esc(e.message)); } }));
        }).catch(() => {});
      } else btn('Usar esta conta neste aparelho', 'primary', async () => { const acc = E.Acc.useCloud(u); const info = await net.cloudInfo().catch(() => ({})); if (info.save) E.Acc.writeSave(acc.id, decodeURIComponent(escape(atob(info.save)))); E.Acc.restart(); });
      btn('Sair da conta online', 'dark', async () => { if (cur && cur.kind === 'cloud') { try { await net.cloudSave(); } catch { /* */ } } await net.logout(); if (cur && cur.kind === 'cloud') { E.Acc.logout(); E.Acc.restart(); } else redraw(); });
    };
    await draw();
    UI.open(el, () => { if (opts.onClose) opts.onClose(); });
  };
  NET().openAccount = ON.openAccount;

  // ------------------------------------------------------------ cooperativo (amigos, online, meu mundo)
  const POLICY = { auto: 'Entrada direta', approve: 'Com minha aprovação', none: 'Ninguém pode entrar' };
  const avatar = (p) => { const h = p.hero || (p.profile && p.profile.hero) || {}; return E.Coop.portrait({ id: p.uid || p.id, look: h.look, cls: h.cls, species: h.species }); };
  ON.panel = async (startTab) => {
    const net = NET();
    if (!net.available() || !net.user) return ON.openAccount({ tab: 'online' });
    if (!net.connected) { net.connect(); UI.toast('🌐 Conectando…'); await U.wait(900); if (!net.connected) return ON.openAccount({ tab: 'online' }); }
    const CW = E.CoopWorld;
    const el = UI.screen('🤝 Cooperativo', { paper: false });
    const body = el.querySelector('.screen-body');
    let tab = startTab || (CW.guest || CW.isHost() ? 'mundo' : 'amigos');
    const draw = async () => {
      const ar = E.Adv ? E.Adv.ar() : 1, wl = E.Adv ? E.Adv.worldWL() : 0;
      body.innerHTML = `<div class="co-head"><div><b>${CW.guest ? `🌍 No mundo de ${U.esc(CW.hostName())}` : '🏠 No seu mundo'}</b><small>UID ${net.uid || net.user.uid} · Rank de Aventura ${ar} · Nível de Mundo ${wl}</small></div><div class="co-tabs">${[['mundo', '🌍 Mundo'], ['amigos', '👥 Amigos'], ['online', '🟢 Online agora'], ['add', '➕ Adicionar']].map(([id, n]) => `<button data-t="${id}" class="${tab === id ? 'on' : ''}">${n}</button>`).join('')}</div></div><div class="co-body"><p class="muted tr-tip">Carregando…</p></div>`;
      body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); }));
      const box = body.querySelector('.co-body');
      const row = (p, actions, extra = '') => {
        const h = p.hero || (p.profile && p.profile.hero) || {};
        const pr = p.profile || {};
        const r = U.h(`<div class="on-p"><img src="${avatar(p)}" alt=""><div><b>${U.esc(p.name)} ${p.online === false ? '<span class="pl-down">●</span>' : '<span class="pl-up">●</span>'}</b><small>UID ${p.uid}${pr.ar ? ` · Rank ${pr.ar} · Mundo ${pr.wl || 0}` : ''}${h.name ? ` · ${U.esc(h.name)} Nv. ${h.level} ${U.esc((E.H.CLASSES[h.cls] || {}).name || '')}` : ''}</small>${p.signature ? `<small>“${U.esc(p.signature)}”</small>` : ''}${extra}</div><div class="on-acts"></div></div>`);
        const acts = r.querySelector('.on-acts');
        for (const [label, fn, cls] of actions) { const b = U.h(`<button class="btn sm ${cls || 'dark'}">${label}</button>`); b.onclick = fn; acts.appendChild(b); }
        return r;
      };
      if (tab === 'mundo') {
        const members = net.party.members.length ? net.party.members : [{ id: net.me, uid: net.uid, name: net.user.name, hero: net.heroSummary(), profile: E.Adv ? E.Adv.summary() : {} }];
        box.innerHTML = `<div class="detail"><h4>${CW.guest ? `Mundo de ${U.esc(CW.hostName())}` : 'Seu mundo'} (${members.length}/4)</h4><div class="co-members"></div>
          <p class="muted tr-tip">${CW.guest ? 'Você é visitante: lute junto, colha e explore. Baús e missões do anfitrião não podem ser usados por visitantes.' : 'Amigos podem entrar no seu mundo para lutar com você. Batalhas perto de outros jogadores do mundo viram batalhas em grupo.'}</p>
          <div class="cs-row" style="justify-content:flex-start;flex-wrap:wrap" data-wa></div></div>
          ${CW.guest ? '' : `<div class="detail"><h4>Quem pode entrar no seu mundo</h4><div class="co-pol">${Object.entries(POLICY).map(([k, n]) => `<button class="btn sm ${net.policy === k ? 'primary' : 'dark'}" data-pol="${k}">${n}</button>`).join('')}</div></div>`}`;
        const mb = box.querySelector('.co-members');
        members.forEach((m, i) => {
          const acts = [];
          if (!CW.guest && m.id !== net.me) acts.push(['Expulsar', () => { CW.kick(m.id); setTimeout(draw, 400); }]);
          mb.appendChild(row(Object.assign({ online: true }, m), acts, `<small class="co-p">P${i + 1}${(m.uid === (CW.guest ? CW.guest.host.uid : net.uid)) ? ' · anfitrião' : ''}</small>`));
        });
        const wa = box.querySelector('[data-wa]');
        const b = (label, fn, cls) => { const x = U.h(`<button class="btn sm ${cls || 'dark'}">${label}</button>`); x.onclick = fn; wa.appendChild(x); };
        if (CW.guest) b('🏠 Voltar ao meu mundo', () => { CW.leave(); UI.close(el); }, 'primary');
        else if (members.length > 1) b('Encerrar cooperativo', () => { CW.close(); setTimeout(draw, 400); });
        box.querySelectorAll('[data-pol]').forEach((x) => (x.onclick = () => { CW.setPolicy(x.dataset.pol); draw(); }));
      }
      if (tab === 'amigos') {
        let data;
        try { data = await net.friends(); } catch (e) { box.innerHTML = `<p class="pl-down">${U.esc(e.message)}</p>`; return; }
        box.innerHTML = `${data.requests.length ? '<div class="detail"><h4>📨 Pedidos de amizade</h4><div class="co-req"></div></div>' : ''}<div class="detail"><h4>👥 Amigos (${data.friends.length}/45)</h4><div class="co-fr"></div></div>`;
        const rq = box.querySelector('.co-req');
        for (const p of data.requests) rq.appendChild(row(p, [['Aceitar', async () => { await net.friendOp('accept', p.uid); draw(); }, 'primary'], ['Recusar', async () => { await net.friendOp('decline', p.uid); draw(); }]]));
        const fr = box.querySelector('.co-fr');
        if (!data.friends.length) fr.innerHTML = '<p class="muted tr-tip">Sem amigos ainda. Adicione pelo UID na aba ➕ ou pela lista de quem está online.</p>';
        for (const p of data.friends) {
          const acts = [];
          if (p.online && !CW.guest) acts.push(['Entrar no mundo', () => { CW.request(p.uid); }, 'primary']);
          if (p.online) acts.push(['Sussurrar', async () => { const t = await ask(`Mensagem para ${p.name}`, 'Escreva…'); if (t) net.send({ t: 'whisper', uid: p.uid, text: t }); }]);
          acts.push(['Remover', async () => { if (await UI.confirm('Remover amigo?', `Remover ${U.esc(p.name)} da sua lista?`, 'Remover')) { await net.friendOp('remove', p.uid); draw(); } }]);
          fr.appendChild(row(p, acts));
        }
      }
      if (tab === 'online') {
        const list = await net.onlineList();
        box.innerHTML = `<div class="detail"><h4>🟢 Jogando agora (${list.length})</h4><div class="co-on"></div></div>`;
        const ol = box.querySelector('.co-on');
        if (!list.length) ol.innerHTML = '<p class="muted tr-tip">Ninguém mais online agora. Chame os amigos: é só abrir o mesmo endereço e criar uma conta.</p>';
        for (const p of list) {
          const acts = [];
          if (!CW.guest && p.host && p.policy !== 'none') acts.push([p.policy === 'auto' ? 'Entrar no mundo' : 'Pedir para entrar', () => CW.request(p.uid), 'primary']);
          if (!p.friend) acts.push(['Adicionar amigo', async () => { try { const r = await net.friendOp('request', p.uid); UI.toast(r.friends ? '🤝 Agora vocês são amigos!' : '📨 Pedido de amizade enviado.', 'gold'); } catch (e) { UI.toast(U.esc(e.message)); } }]);
          ol.appendChild(row(Object.assign({ online: true }, p), acts, `<small>${p.host ? `🌍 Mundo próprio · ${p.count}/4 · ${POLICY[p.policy] || ''}` : '🤝 Visitando outro mundo'}</small>`));
        }
      }
      if (tab === 'add') {
        box.innerHTML = `<div class="detail"><h4>➕ Adicionar amigo pelo UID</h4><p class="muted tr-tip">Seu UID é <b>${net.uid || net.user.uid}</b> — passe para os amigos.</p><div class="srv">${field('data-uid inputmode="numeric" placeholder="UID (9 dígitos)" maxlength="12"')}<button class="btn sm primary" data-a="find">Procurar</button></div><div class="co-found"></div></div>`;
        box.querySelector('[data-a=find]').onclick = async () => {
          const uid = box.querySelector('[data-uid]').value.replace(/\D/g, '');
          const out = box.querySelector('.co-found');
          try {
            const p = await net.userByUid(uid);
            out.innerHTML = '';
            out.appendChild(row(p, [['Adicionar amigo', async () => { try { const r = await net.friendOp('request', p.uid); UI.toast(r.friends ? '🤝 Agora vocês são amigos!' : '📨 Pedido de amizade enviado.', 'gold'); } catch (e) { UI.toast(U.esc(e.message)); } }, 'primary']]));
          } catch (e) { out.innerHTML = `<p class="pl-down">${U.esc(e.message)}</p>`; }
        };
      }
    };
    await draw();
    const off = U.on('net:msg', (m) => { if (['party', 'wjoin', 'wleft', 'wexit', 'fnew', 'fstatus'].includes(m.t) && el.isConnected && (tab === 'mundo' || tab === 'amigos')) draw(); });
    UI.open(el, off);
  };
  const ask = (title, ph, type = 'text', value = '') => new Promise((resolve) => {
    UI.modal({ title, html: `<input class="field" type="${type}" placeholder="${U.esc(ph)}" maxlength="200" value="${U.esc(value)}">`, buttons: [{ label: 'Cancelar', value: null }, { label: 'OK', value: 'ok', cls: 'primary' }] }).then((v) => resolve(v === 'ok' ? inp.value.trim() : null));
    const inp = UI._modalBody.querySelector('input'); setTimeout(() => inp.focus(), 50);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); UI._modalClose('ok'); } });
  });

  // ------------------------------------------------------------ chat
  ON.mountChat = (hud) => {
    chatEl = U.h(`<div class="chatbox ${NET().connected ? '' : 'off'}"><div class="cb-log"></div><div class="cb-in"><select><option value="world">Mundo</option><option value="global">Global</option></select><input maxlength="200" placeholder="Enter para conversar…"><button class="cb-emo">😀</button></div><button class="cb-open icon-btn" title="Chat">💬</button></div>`);
    hud.appendChild(chatEl);
    const inp = chatEl.querySelector('input');
    const open = () => { chatEl.classList.add('typing'); E.WG.locked = true; setTimeout(() => inp.focus(), 30); };
    const close = () => { chatEl.classList.remove('typing'); inp.blur(); if (!UI.anyOpen() && !E.BattleUI.current) E.WG.locked = false; };
    chatEl.querySelector('.cb-open').onclick = open;
    inp.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { const t = inp.value.trim(); if (t) NET().send({ t: 'chat', text: t, scope: chatEl.querySelector('select').value }); inp.value = ''; close(); }
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    inp.addEventListener('keyup', (e) => e.stopPropagation());
    chatEl.querySelector('.cb-emo').onclick = () => { const e = U.pick(EMOTES); NET().send({ t: 'emote', e }); bubbles.set(NET().me, { e, until: Date.now() + 3500 }); close(); };
    renderChat();
  };
  addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !chatEl || !NET().connected || chatEl.classList.contains('typing')) return;
    if (UI.anyOpen() || E.BattleUI.current || document.querySelector('.modal-bg, #dialog, .fishing') || /INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) return;
    e.preventDefault(); chatEl.querySelector('.cb-open').click();
  });
  const renderChat = () => {
    if (!chatEl) return;
    const now = Date.now();
    chatEl.querySelector('.cb-log').innerHTML = chatLog.slice(-7).map((m) => `<p class="${m.scope} ${now - m.at > 15000 ? 'old' : ''}"><b>${U.esc(m.name)}</b>${m.scope === 'global' ? ' 🌐' : m.scope === 'world' ? ' 🌍' : m.scope === 'whisper' ? ' ✉' : ''}: ${U.esc(m.text)}</p>`).join('');
  };
  setInterval(renderChat, 4000);

  // ------------------------------------------------------------ outros jogadores no mundo
  ON.tick = (w, dt) => {
    const net = NET();
    w.remote = w.remote || new Map();
    const seen = new Set();
    if (net.connected) for (const p of net.players.values()) {
      if (!p.hero || p.region !== w.id) continue;
      seen.add(p.id);
      let r = w.remote.get(p.id);
      const lookKey = JSON.stringify(p.hero.look) + (p.hero.weapon ? p.hero.weapon.c1 + p.hero.weapon.rar : '');
      if (!r || r.lookKey !== lookKey) {
        if (r) { w.scene.remove(r.sprite); w.scene.remove(r.shadow); }
        const wi = p.hero.weapon || {};
        const draw = (f) => E.CH.draw({ look: E.CH.normalize(p.hero.look, p.hero.cls, p.hero.species), species: p.hero.species, frame: f, weaponType: wi.type, weaponColor: { c1: wi.c1 || '#dfe6ee', c2: wi.c2 || '#d4af37', shape: wi.shape || null }, weaponRarity: wi.rar || 1 });
        const frames = ['idle0', 'idle1', ...Array.from({ length: 12 }, (_, i) => 'w' + i), 'jump1', 'jump2'].map(draw);
        const hh = 2.5 * E.WG.speciesScale(p.hero.species) * ((p.hero.look && p.hero.look.height) || 1);
        const sprite = w.makeSprite(frames[0], hh);
        w.scene.add(sprite);
        const shadow = w.addShadow(p.x, w.height(p.x, p.z), p.z, 0.5);
        r = { sprite, frames, shadow, x: p.x, z: p.z, lookKey, h: hh };
        w.remote.set(p.id, r);
      }
      const k = Math.min(1, dt * 10);
      r.x += (p.x - r.x) * k; r.z += (p.z - r.z) * k;
      if (Math.hypot(p.x - r.x, p.z - r.z) > 12) { r.x = p.x; r.z = p.z; }
      const y = w.height(r.x, r.z);
      r.j = (r.j || 0) + ((p.j || 0) - (r.j || 0)) * Math.min(1, dt * 14);
      r.sprite.position.set(r.x, y + r.j, r.z);
      r.shadow.position.set(r.x, y + 0.05, r.z);
      const moving = p.m && Math.hypot(p.x - r.x, p.z - r.z) > 0.02 || p.m;
      const f = r.j > 0.05 ? (p.vy > -1 ? 14 : 15) : moving ? 2 + (Math.floor(w.t * 17) % 12) : Math.floor(w.t * 1.8) % 2;
      r.sprite.material.map = w.tex(r.frames[f]);
      const s = Math.abs(r.sprite.scale.x); r.sprite.scale.x = (p.d || 1) * s;
      r.y = y;
    }
    for (const [id, r] of w.remote) if (!seen.has(id)) { w.scene.remove(r.sprite); w.scene.remove(r.shadow); w.remote.delete(id); }
  };
  ON.labels = (w) => {
    const net = NET(); if (!net.connected || !w.remote) return '';
    let html = '';
    const now = Date.now();
    for (const [id, r] of w.remote) {
      const p = net.players.get(id); if (!p) continue;
      const d = Math.hypot(r.x - w.hero.x, r.z - w.hero.z); if (d > 26) continue;
      const q = w.project(r.x, r.y + r.h + 0.35, r.z); if (q.behind) continue;
      const b = bubbles.get(id);
      html += `<div class="nlabel player ${net.inParty(id) ? 'party' : ''}" style="left:${q.x}px;top:${q.y}px">${b && b.until > now ? `<span class="emo">${b.e}</span>` : ''}${U.esc(p.name)}<small>${p.hero.title ? U.esc(p.hero.title) : `Nv. ${p.hero.level}`}</small></div>`;
    }
    const mb = bubbles.get(net.me);
    if (mb && mb.until > now) { const q = w.project(w.hero.x, w.hero.y + 3.1, w.hero.z); html += `<div class="nlabel player" style="left:${q.x}px;top:${q.y}px"><span class="emo">${mb.e}</span></div>`; }
    return html;
  };

  // ------------------------------------------------------------ mensagens recebidas
  U.on('net:msg', async (m) => {
    const net = NET();
    if (m.t === 'chat') { chatLog.push({ name: m.name, text: m.text, scope: m.scope, at: Date.now() }); if (chatLog.length > 60) chatLog.shift(); renderChat(); }
    if (m.t === 'emote') bubbles.set(m.id, { e: m.e, until: Date.now() + 3500 });
    if (m.t === 'gift') { const h = E.Store.hero(); if (h) { h.gold += m.gold; E.Store.save(); E.HUD.update(); UI.loot('🪙', `${m.gold} po de ${U.esc(m.name)}!`); } }
    if (['welcome', 'wjoin', 'wleft', 'wenter', 'wexit', 'party'].includes(m.t)) { E.HUD.online(true, net.players.size + 1); if (E.HUD.coop) E.HUD.coop(); }
  });
  U.on('net:status', (on) => { E.HUD.online(on, NET().players.size + 1); if (chatEl) chatEl.classList.toggle('off', !on); });
  // atualiza o herói para os outros quando muda o visual/nível
  U.on('quests:changed', () => NET().connected && NET().hello());

  // conecta sozinho ao entrar no mundo, se já houver conta
  ON.autoConnect = () => { const net = NET(); if (net.user && net.token && net.available() && net.isActiveAccount() && E.Store.hero()) net.connect(); };

  E.Online = ON;
})();
