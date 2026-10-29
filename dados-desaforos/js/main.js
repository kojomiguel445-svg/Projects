/* Inicialização e fluxo principal do jogo. */
(() => {
  const U = E.U, UI = E.UI, C = E.C;
  const G = {};

  G.boot = async () => {
    await E.Icons.preload();
    E.Store.load();
    // Saves antigos: escolhas de espécie da edição 2024 e características por nível (ver C.migrate)
    for (const h of E.state.heroes || []) if (h && !h.deleted) { try { C.migrate(h); } catch (e) { console.error(e); } }
    E.Store.save();
    document.body.classList.toggle('touch', U.isTouch());
    document.body.classList.toggle('reduced', !!E.state.settings.reducedMotion);
    try {
      E.WG.init(document.getElementById('game'));
    } catch (e) {
      console.error(e);
      document.getElementById('loading').innerHTML = '<div class="lw"><div class="lt">ESTE NAVEGADOR NÃO SUPORTA WEBGL</div><p style="color:#ccc;max-width:420px">Ative a aceleração de hardware ou use um navegador atualizado (Chrome, Edge, Firefox ou Safari).</p></div>';
      return;
    }
    // eventos do mundo
    U.on('world:near', (l) => E.HUD.setNear(l));
    U.on('world:frame', () => E.HUD.frame());
    U.on('world:aggro', () => E.Audio.sfx('aggro'));
    // Em área protegida (vila, Aurenna, interiores) não há combate: a arma está guardada.
    U.on('world:encounter', (camp) => { if (E.Zones && E.Zones.here().safe) { E.WG.locked = false; return; } G.startBattle(camp.enc.monsters, { camp }); });
    U.on('quests:changed', () => { E.HUD.update(); if (E.WG.world) E.WG.world.refreshNpcMarkers(); });
    // com qualquer tela aberta o herói fica parado (e os inimigos não atacam)
    U.on('ui:screen', (n) => { if (n > 0) E.WG.locked = true; else if (!E.BattleUI.current && !document.getElementById('dialog')) E.WG.locked = false; });
    // atalhos de teclado (como no Genshin)
    addEventListener('keydown', (e) => {
      if (e.repeat || e.defaultPrevented || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
      if (E.WG.mode() !== 'world' || E.BattleUI.current || document.querySelector('.modal-bg, #dialog, .wish-anim, .reveal, .summary')) return;
      if (UI.anyOpen() || (E.WorldServices && E.WorldServices.active)) return;
      const k = e.code;
      if (k === 'KeyM') E.Wonders.regionMap();
      else if (k === 'KeyJ') E.Journal.quests();
      else if (k === 'KeyC') E.Sheet.open();
      else if (k === 'KeyI') E.Arsenal.open();
      else if (k === 'KeyO') E.Wish.open();
      else if (k === 'Escape') E.Menu.open();
    });
    // celular: força paisagem (tela cheia + trava de orientação quando o navegador permite)
    if (U.isTouch() && !E.App.native) {
      const land = () => {
        const d = document.documentElement;
        const lock = () => { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) { /* sem suporte */ } };
        if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen({ navigationUI: 'hide' }).then(lock, lock);
        else lock();
      };
      addEventListener('pointerup', land, { passive: true });
      const fit = () => setTimeout(() => { if (E.WG.resize) E.WG.resize(); else dispatchEvent(new Event('resize')); }, 250);
      addEventListener('orientationchange', fit);
    }
    // app instalável (PWA): service worker + botão "Instalar"
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/standalone\.html$/.test(location.pathname)) {
      if (E.Updates) E.Updates.init();
    }
    addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); G.installPrompt = e; U.emit('app:installable'); });
    E.Title.show();
    const ld = document.getElementById('loading');
    ld.style.opacity = 0;
    setTimeout(() => ld.remove(), 600);
  };

  G.enterWorld = async (fresh) => {
    const h = E.Store.hero();
    if (!h || h.dead) return E.Creator.open();
    UI.closeAll();
    E.WG.locked = false;
    E.WG.loadRegion(E.state.world.region || 'bosque');
    E.WG.setMode('world');
    E.HUD.mount();
    if (E.Online) E.Online.autoConnect();
    E.Audio.music(E.WG.world.B.night ? 'noite' : 'calma');
    G.regionTitle();
    if (!fresh && E.state.seenVersion !== E.Title.VERSION) { await U.wait(1200); await G.whatsNew(); }
    // escolhas da edição 2024 que faltavam no save (linhagem, ancestralidade, talento de origem)
    if (!fresh && (h.pendingChoices || []).length && E.Creator.resolvePending) { await U.wait(500); await E.Creator.resolvePending(h); }
    // heróis antigos (nível 3+) escolhem a subclasse uma vez
    if (!fresh && h.level >= E.H.SUB_LEVEL && !h.subChosen && !h.subAsked) { await U.wait(400); await E.Sheet.subclass(h); }
    if (fresh) {
      E.state.seenVersion = E.Title.VERSION; E.Store.save();
      await U.wait(900);
      await E.Interact.dialog({ name: 'Morgana', title: 'Sua guia', lines: [E.WD.MORGANA.welcome, `Você é ${h.name}, ${C.species(h).name.toLowerCase()} ${C.cls(h).name.toLowerCase()}. As regras aqui são as de D&D 5.5: d20, Vantagem, Maestria em Armas, tudo certinho!`, 'Use WASD (ou o joystick) para andar, arraste a tela para girar a câmera e F (ou o botão de mão) para interagir.', 'Toma 1600 Gemas Estelares e 10 Selos de boas-vindas. Visite o Oráculo (a estrela no canto) para tentar a sorte com armas lendárias!'], options: [{ id: 'ok', label: 'Vamos lá!', icon: '✦' }] });
    }
  };

  // novidades da versão (uma vez por versão)
  G.whatsNew = async () => {
    E.state.seenVersion = E.Title.VERSION; E.Store.save();
    const html = `<div class="whatsnew"><ul>
      <li><b>Regras do Livro do Jogador 2024 conferidas:</b> as 10 espécies (sem Meio-Elfo e Meio-Orc), atributos vindos do antecedente, Draconato com sopro em cone ou linha, ancestral que muda a cor das escamas e Voo Dracônico, linhagens dos Elfos e Gnomos, legados do Tiferino, ancestrais gigantes do Golias e Revelação Celestial do Aasimar. A ficha mostra de onde vem cada ponto da CA (regra ou jogo). Personagens antigos foram migrados e, quando falta uma escolha, o jogo pergunta.</li>
      <li><b>Cozinhar de verdade:</b> no fogão você controla a chama e mexe na hora certa; na fogueira vira o espeto e tira do fogo no ponto — ou queima. O prato sai Mal preparado, Normal, Bem preparado ou Excelente e mata mais ou menos a fome. A fome agora cai mais devagar (cerca de 50 minutos explorando) e o ritmo pode ser ajustado em Ajustes.</li>
      <li><b>Barra rápida:</b> 9 espaços abaixo da vida e da fome (teclas 1–9). O 1 é a sua arma; os outros guardam atalhos para comidas e poções da mochila — aperte de novo para comer ou beber. Botão direito troca o item. A troca de personagem passou para F1–F3.</li>
      <li><b>Áreas protegidas:</b> nas vilas, em Aurenna e dentro de lojas e casas a arma vai para a bainha e ninguém briga.</li>
      <li><b>Tipo físico Gordo:</b> visual próprio, fome um pouco mais rápida e chance de Refletir Golpes corpo a corpo (mecânica do jogo, não é regra de D&amp;D).</li>
      <li><b>Pendências resolvidas:</b> clique no chão para andar, botão direito do mouse gira a câmera, Shift na água para nadar rápido (nadar normal não cansa), escolha da isca na vara, casa de penhores na Galeria dos Mercadores de Aurenna e dragões morando em ninhos nas grutas.</li>
    </ul></div>`;
    await UI.modal({ title: `✦ Novidades da versão ${E.Title.VERSION}`, html, buttons: [{ label: 'Ver o Oráculo', value: 'wish' }, { label: 'Bora jogar!', value: true, cls: 'primary' }] }).then((v) => { if (v === 'wish') E.Wish.open(); });
  };

  G.regionTitle = () => {
    const w = E.WG.world;
    const t = U.h(`<div class="region-title" style="position:fixed;left:0;right:0;top:30%;text-align:center;z-index:13;pointer-events:none;animation:logoIn 1s ease both, toastOut 1s ease 3.2s forwards"><div style="font-family:var(--display);font-size:clamp(26px,4.4vw,48px);font-weight:900;color:#fff;text-shadow:0 3px 16px rgba(0,0,0,.6)">${U.esc(w.reg.name)}</div><div style="margin-top:6px;letter-spacing:.3em;font-size:13px;color:var(--gold-2);text-shadow:0 1px 6px #000">${U.esc(w.reg.weather.toUpperCase())}</div></div>`);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4400);
  };

  G.travel = async (id, opts = {}) => {
    if (E.WorldServices) E.WorldServices.close();
    if (E.Interior && E.Interior.current) E.Interior.close();
    const fade = U.h('<div class="flash" style="background:#fff;opacity:0;transition:opacity .4s"></div>');
    document.body.appendChild(fade);
    requestAnimationFrame(() => (fade.style.opacity = 1));
    await U.wait(450);
    const first = !E.state.world.visited[id];
    E.state.world.pos = null;
    E.WG.loadRegion(id);
    E.WG.setMode('world');
    E.WG.locked = false;
    E.HUD.mount();
    E.Store.save();
    fade.style.opacity = 0;
    setTimeout(() => fade.remove(), 500);
    E.Audio.music(E.WG.world.B.night ? 'noite' : 'calma');
    G.regionTitle();
    if (first && !E.WG.world.cave && !(E.CoopWorld && E.CoopWorld.guest)) setTimeout(() => UI.toast('✦ Estátua de Teleporte despertada', 'gold'), 1500);
    const h = E.Store.hero();
    if (!opts.quiet && h && h.level < E.WD.reg(id).level) setTimeout(() => UI.toast(`⚠ Região perigosa: recomendado nível ${E.WD.reg(id).level}+`), 2500);
    U.emit('world:travel', id);
  };

  G.startBattle = async (keys, opts = {}) => {
    if (E.WorldServices) E.WorldServices.close();
    if (E.Interior && E.Interior.current) E.Interior.close();
    E.WG.locked = true;
    UI.closeAll();
    // transição
    const fx = U.h('<div class="flash go"></div>');
    document.body.appendChild(fx);
    await U.wait(320);
    await E.BattleUI.start(keys, opts);
    setTimeout(() => fx.remove(), 800);
  };

  G.levelUp = async (h, n) => {
    const fresh = h.lastFresh ?? n; // níveis recuperados após uma morte não dão gemas de novo
    E.state.gems += 160 * fresh;
    E.Audio.sfx('levelup');
    const from = h.level - n;
    const feats = [...C.cls(h).features, ...(C.sub(h) && h.subChosen ? C.sub(h).features : [])].filter(([lv]) => lv > from && lv <= h.level).sort((a, b) => a[0] - b[0]);
    const slots = C.slotsMax(h);
    const html = `<div style="text-align:center"><img src="${UI.heroPortrait(h)}" style="width:90px;image-rendering:pixelated" alt=""><div style="font-family:var(--display);font-size:42px;font-weight:900;color:#b8862a">Nível ${h.level}</div><p style="color:#5a6378;font-size:14px">PV máximos: <b>${C.maxHp(h)}</b> · Bônus de Proficiência: <b>+${C.pb(h)}</b>${slots.length ? ` · Espaços: <b>${slots.map((s, i) => s ? `${s}×${i + 1}º` : '').filter(Boolean).join(', ')}</b>` : ''}</p>${fresh ? `<p style="color:#5a6378;font-size:13px">+${160 * fresh} 💎 Gemas Estelares de recompensa</p>` : '<p style="color:#5a6378;font-size:13px">Nível recuperado!</p>'}</div>${feats.map(([lv, , nm, d]) => `<div class="feat"><div class="fh"><span>${nm}</span><small>Nível ${lv}</small></div><p>${d}</p></div>`).join('')}`;
    await UI.modal({ title: fresh ? 'Subiu de nível!' : 'Nível recuperado!', html, buttons: [{ label: 'Incrível!', value: true, cls: 'primary' }] });
    if (h.level >= E.H.SUB_LEVEL && !h.subChosen && from < E.H.SUB_LEVEL) await E.Sheet.subclass(h);
    if (h.pendingStyle) await E.Sheet.style(h);
    if (C.hasFx(h, 'styleExtra') && !h.fightingStyle2) await E.Sheet.style(h, 2);
    if (h.pendingAsi) await E.Sheet.asi(h);
    if (E.WG.world) E.WG.world.refreshHeroFrames();
    E.Store.save();
    E.HUD.update();
  };

  G.afterDeath = () => {
    const alive = E.state.heroes.filter((x) => !x.dead && !x.deleted);
    UI.closeAll();
    if (alive.length) { E.state.activeHero = alive[0].id; E.Store.save(); E.Journal.heroes(); }
    else E.Creator.open();
  };

  G.install = async () => {
    if (G.installPrompt) { G.installPrompt.prompt(); const r = await G.installPrompt.userChoice; G.installPrompt = null; if (r.outcome === 'accepted') UI.toast('✦ Elarion instalado! Procure o ícone na sua tela inicial.', 'gold'); return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    UI.alert('Instalar como aplicativo', ios ? 'No iPhone/iPad: toque em Compartilhar (□↑) no Safari e depois em “Adicionar à Tela de Início”.' : location.protocol === 'file:' ? 'Para instalar, abra o jogo por um endereço http(s) — por exemplo, rodando “node server.cjs” ou publicando no GitHub Pages/Render. Veja o README.' : 'No Chrome/Edge: menu ⋮ → “Instalar app” (ou “Adicionar à tela inicial”). Se a opção não aparecer, o app já está instalado.');
  };

  E.Game = G;
  addEventListener('DOMContentLoaded', G.boot);
})();
