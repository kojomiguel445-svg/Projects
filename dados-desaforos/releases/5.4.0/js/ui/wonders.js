/* Maravilhas — telas: ler monumentos (com teste de perícia para o segredo), altar de invocação, estátuas de
   teleporte espalhadas, aviso de eventos no HUD, Crônicas de Elarion e o mapa da região. */
(() => {
  const U = E.U, UI = E.UI, LO = E.LORE, W = E.WON;
  const WU = {};
  const IN = () => E.Interact;
  const fight = (keys, opts) => new Promise((resolve) => { const off = U.on('battle:end', (res) => { off(); resolve(res); }); E.Game.startBattle(keys, opts); });
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  WU.run = async (it) => {
    const w = E.WG.world;
    if (it.kind === 'monument') await WU.monument(it);
    else if (it.kind === 'summon') await WU.summon(it);
    else if (it.kind === 'statue') await WU.statue(it);
    else if (it.kind === 'evlantern' && w.event && !w.event.done) E.WN3.lightLantern(w, it.item);
  };

  // ------------------------------------------------ monumentos
  WU.monument = async (it) => {
    const w = E.WG.world, def = W.monuments(it.reg)[it.i];
    if (!def) return;
    const first = !W.isRead(it.reg, it.i), sec = W.hasSecret(it.reg, it.i);
    const lines = [`${def.era}.`, def.text, `A inscrição diz: ${def.verse}`];
    if (sec) lines.push(`Segredo que você descobriu: ${def.secret}`);
    const sk = E.R.SKILLS[def.check.skill];
    const opts = [];
    if (!sec) opts.push({ id: 'secret', label: `Procurar o segredo (${sk.name} CD ${def.check.dc})`, icon: '🔍' });
    opts.push({ id: 'ok', label: first ? 'Registrar nas Crônicas' : 'Continuar', icon: '📜' });
    const ch = await IN().dialog({ name: def.name, title: `${w.reg.name} · Monumento antigo`, lines, options: opts });
    if (first) {
      const r = W.read(it.reg, it.i);
      E.WN3.markRead(w, it.i);
      E.Audio.sfx('chest');
      UI.loot('💎', `${r.gems} Gemas Estelares`); UI.loot(W.STONE.icon, `${r.stones} ${W.STONE.name}${r.stones > 1 ? 's' : ''}`);
      if (E.Adv) E.Adv.add(r.adv, 'monumento');
      UI.toast(r.chronicle ? `📜 Crônica de ${w.reg.name} completa! +150 💎 e mais uma Pedra de Invocação.` : `🏛 Monumento registrado nas Crônicas: ${def.name}`, 'gold');
    }
    if (ch === 'secret') {
      const ok = await IN().check(def.check.skill, def.check.dc, def.name);
      if (ok) {
        const r = W.foundSecret(it.reg, it.i);
        await IN().dialog({ name: def.name, title: 'Segredo descoberto', lines: [def.secret], options: [{ id: 'ok', label: 'Anotar nas Crônicas', icon: '✦' }] });
        if (r) { UI.loot('💎', `${r.gems} Gemas Estelares`); E.Audio.sfx('star4'); }
      } else UI.toast('Você não encontra nada desta vez. Volte e tente de novo.');
    }
    E.HUD.update();
  };

  // ------------------------------------------------ altar de invocação
  WU.summon = async (it) => {
    const w = E.WG.world, S = W.summon(it.reg); if (!S) return;
    const def = E.M.MONSTERS[S.key], cd = W.cooldown(it.reg), h = E.Store.hero();
    const esc = S.escort.length ? ` Escolta: ${S.escort.map((k) => E.M.MONSTERS[k].name).join(', ')}.` : '';
    const lines = [S.lore, `${S.title} (${def.name}, ND ${def.cr}).${esc} Recomendado: nível ${S.rec}+.`, cd ? `O altar está frio. O chefe dorme por mais ${Math.ceil(cd / 60000)} min.` : `Você tem ${W.stones()} ${W.STONE.icon} ${W.STONE.name}${W.stones() === 1 ? '' : 's'}. Uma delas acorda o chefe.`];
    const opts = [];
    if (!cd) opts.push({ id: 'go', label: W.stones() ? `Oferecer 1 ${W.STONE.name} e invocar` : `Sem ${W.STONE.name}s (leia monumentos e vença eventos)`, icon: '🔮' });
    opts.push({ id: 'bye', label: 'Sair', icon: '👋' });
    const ch = await IN().dialog({ name: 'Altar de Invocação', title: w.reg.name, lines, options: opts });
    if (ch !== 'go' || !W.stones()) return;
    if (h.level < S.rec - 1 && !(await UI.confirm('Perigo!', `${S.title} é recomendado para nível ${S.rec}+. Você está no nível ${h.level}. Invocar mesmo assim?`, 'Invocar', 'Melhor não'))) return;
    if (!W.useStone(it.reg)) return;
    E.Audio.sfx('wish');
    const res = await fight([S.key, ...S.escort], { summon: it.reg, noCoop: true, banner: `🔮 Chefe invocado · ${S.title}` });
    if (res.outcome !== 'win') { UI.toast(`${S.title} volta a dormir no altar. A Pedra foi consumida.`, 'big'); return; }
    const r = W.summonReward(it.reg);
    E.Audio.sfx('levelup');
    const frag = Object.entries(r.frags).map(([k, n]) => `${E.Forge.FRAGS[k].icon} ${n}× ${E.Forge.FRAGS[k].name}`).join(' · ');
    await UI.modal({ title: `🔮 ${S.title} derrotado!`, html: `<div style="text-align:center;font-size:14.5px"><p>${r.first ? '<b>Primeira vitória!</b> O nome dele agora está nas Crônicas.' : 'O chefe volta a dormir no altar por 30 minutos.'}</p><p><b>+${r.gems} 💎 · ${frag} · ${E.Forge.CORE_ICON} ${r.cores}× ${E.Forge.CORE}${r.arrow ? ' · 🏹 1 Fragmento da Flecha' : ''}${r.stones ? ` · ${W.STONE.icon} ${r.stones} ${W.STONE.name}` : ''}</b></p></div>`, buttons: [{ label: 'Glória!', value: true, cls: 'primary' }] });
    E.HUD.update();
  };

  // ------------------------------------------------ estátuas espalhadas
  WU.teleportTargets = (w) => {
    const out = [{ id: 'c', label: 'Estátua central (vila)', x: w.waypoint.x + 2, z: w.waypoint.z + 2 }];
    for (const s of w.statueObjs || []) if (s.on) out.push({ id: 's' + s.i, label: `Estátua ${['do norte', 'do leste', 'do sul', 'do oeste', 'distante', 'distante'][WU.dirIdx(s)]}`, x: s.x + 2.2, z: s.z + 2.2 });
    return out;
  };
  WU.dirIdx = (s) => { const a = Math.atan2(s.z, s.x); const d = Math.round(((a + Math.PI * 2.5) % (Math.PI * 2)) / (Math.PI / 2)) % 4; return [0, 1, 2, 3][d]; };
  WU.teleport = async (x, z) => {
    const w = E.WG.world;
    const fade = U.h('<div class="flash" style="background:#0b0f1e;opacity:0;transition:opacity .35s"></div>');
    document.body.appendChild(fade); requestAnimationFrame(() => (fade.style.opacity = 1));
    E.Audio.sfx('spell');
    await U.wait(380);
    w.hero.x = x; w.hero.z = z; w.hero.y = w.height(x, z);
    for (const c of w.camps) c.aggro = false;
    fade.style.opacity = 0; setTimeout(() => fade.remove(), 450);
  };
  WU.teleportMenu = async (fromId) => {
    const w = E.WG.world, list = WU.teleportTargets(w).filter((t) => t.id !== fromId);
    if (!list.length) { UI.toast('Desperte outras estátuas desta região chegando perto delas.'); return; }
    const ch = await UI.choose({ title: '✦ Viajar para outra estátua', text: 'Estátuas despertadas desta região:', options: list.map((t) => ({ id: t.id, label: t.label })) });
    const t = list.find((x) => x.id === ch);
    if (t) await WU.teleport(t.x, t.z);
  };
  WU.statue = async (it) => {
    const w = E.WG.world;
    if (!W.statueOn(it.reg, it.i)) { W.wakeStatue(it.reg, it.i); const s = (w.statueObjs || []).find((o) => o.i === it.i); if (s) E.WN3.lightStatue(w, s); }
    const ch = await IN().dialog({ name: 'Estátua de Teleporte', title: w.reg.name, lines: ['A estátua desperta com um zumbido azul. Daqui você pode viajar para as outras estátuas despertadas desta região — ou abrir o mapa.'], options: [{ id: 'tp', label: 'Viajar para outra estátua desta região', icon: '✦' }, { id: 'map', label: 'Abrir o mapa da região', icon: '🗺' }, { id: 'short', label: 'Descanso Curto', icon: '☕' }, { id: 'bye', label: 'Sair', icon: '👋' }] });
    if (ch === 'tp') await WU.teleportMenu('s' + it.i);
    if (ch === 'map') WU.regionMap();
    if (ch === 'short') await IN().shortRest();
  };
  // exploração (v4.5)
  U.on('explore:peak', () => { E.Audio.sfx('star4'); UI.toast('⛰ Pico alcançado! Que vista… (+30 💎). Com o planador equipado, segure Espaço no ar ou toque pular no celular.', 'gold'); });
  U.on('explore:seelie', ({ type }) => { if (type === 'start') UI.toast('✨ Um Lume-Guia acordou! Siga-o até o santuário dele.'); else UI.toast('✨ O Lume-Guia chegou em casa: um baú apareceu ao lado do santuário!', 'gold'); });
  U.on('explore:torchlit', ({ lit }) => UI.toast(`🔥 Tochas acesas: ${lit}/4 — acenda todas antes que se apaguem!`));
  U.on('explore:torch', () => { E.Audio.sfx('star5'); UI.toast('🔥 As quatro tochas queimam juntas: o selo se quebrou!', 'gold'); });
  U.on('wonder:statue', () => { E.Audio.sfx('star4'); UI.toast('✦ Estátua de Teleporte despertada! Agora dá para viajar até aqui (+20 💎).', 'gold'); E.state.gems; });

  // ------------------------------------------------ eventos: aviso no HUD
  let evEl = null;
  const evBox = () => {
    const tl = document.querySelector('#hud .hud-tl');
    if (!tl) return null;
    if (!evEl || !tl.contains(evEl)) { evEl = U.h('<div class="ev-track"></div>'); tl.appendChild(evEl); evEl.onclick = () => WU.regionMap(); }
    return evEl;
  };
  U.on('wonder:event', ({ type, ev, reward }) => {
    if (type === 'start') { UI.toast(`${ev.def.icon} Evento: ${ev.def.name}! ${ev.def.desc}`, 'gold big'); }
    else if (type === 'done') {
      E.Audio.sfx('levelup');
      UI.toast(`${ev.def.icon} ${ev.def.name}: concluído!`, 'gold big');
      if (reward) { UI.loot('💎', `${reward.gems} Gemas Estelares`); UI.loot(W.STONE.icon, `1 ${W.STONE.name}`); if (reward.gold) UI.loot('🪙', `${reward.gold} po`); for (const [k, n] of Object.entries(reward.frags)) UI.loot(E.Forge.FRAGS[k].icon, `${n}× ${E.Forge.FRAGS[k].name}`); }
      E.HUD.update();
    } else if (type === 'fail') UI.toast(`${ev.def.icon} ${ev.def.name}: o tempo acabou.`);
  });
  setInterval(() => {
    const w = E.WG && E.WG.world, box = evBox();
    if (!box) return;
    const ev = w && w.event;
    if (!ev || ev.done) { box.classList.remove('on'); return; }
    const d = Math.round(Math.hypot(ev.x - w.hero.x, ev.z - w.hero.z));
    const prog = ev.need > 1 ? ` · ${ev.prog}/${ev.need}` : '';
    box.classList.add('on');
    box.style.setProperty('--ev', ev.def.color);
    box.innerHTML = `<div class="t1">${ev.def.icon} Evento · ${U.esc(ev.def.name)}</div><div class="t2">${ev.id === 'tesouro' ? 'Alcance o baú dourado!' : ev.id === 'meteoros' ? 'Recolha os fragmentos de estrela' : ev.id === 'vigilia' ? 'Reacenda as lanternas' : 'Derrote os atacantes'}${prog}</div><div class="dist">⏳ ${mmss(Math.max(0, ev.t))} · ${d} m</div>`;
  }, 500);

  // ------------------------------------------------ Crônicas de Elarion
  WU.chronicle = () => {
    const el = UI.screen('📜 Crônicas de Elarion');
    const body = el.querySelector('.screen-body');
    const T = W.totals(), d = W.data();
    let html = `<p class="muted tr-tip">Cada região guarda três monumentos antigos. Ler um pela primeira vez rende 💎 e uma ${W.STONE.icon} ${W.STONE.name}; os três de uma região completam a crônica dela. Um teste de perícia revela o segredo de cada um. As Pedras acordam os chefes dos Altares de Invocação.</p>
      <div class="chr-sum"><span>🏛 Monumentos: <b>${T.read}/${T.all}</b></span><span>🔍 Segredos: <b>${T.sec}/${T.all}</b></span><span>${W.STONE.icon} Pedras de Invocação: <b>${W.stones()}</b></span><span>☄ Eventos concluídos: <b>${d.events}</b></span></div>`;
    for (const reg of E.WD.REGION_ORDER) {
      const R = E.WD.REGIONS[reg], list = W.monuments(reg), S = W.summon(reg);
      if (!list.length) continue;
      const beaten = d.beaten[reg] || 0;
      html += `<div class="chr-reg ${d.chron[reg] ? 'done' : ''}"><h3>${U.esc(R.name)} <small>${W.readCount(reg)}/${list.length}${d.chron[reg] ? ' · crônica completa ✓' : ''}</small></h3>`;
      list.forEach((m, i) => {
        const read = W.isRead(reg, i), sec = W.hasSecret(reg, i);
        html += read ? `<div class="chr-m"><b>🏛 ${U.esc(m.name)}</b><small>${U.esc(m.era)}</small><p>${U.esc(m.text)}</p><p class="vs">${U.esc(m.verse)}</p>${sec ? `<p class="sec">🔍 ${U.esc(m.secret)}</p>` : `<p class="sec lock">🔍 Segredo ainda escondido (${U.esc(E.R.SKILLS[m.check.skill].name)} CD ${m.check.dc}).</p>`}</div>`
          : `<div class="chr-m lock"><b>🏛 ???</b><small>${U.esc(LO.KIND_NAME[m.kind] || 'Um monumento antigo')} espera em ${U.esc(R.name)}.</small></div>`;
      });
      if (S) html += `<div class="chr-boss ${beaten ? '' : 'lock'}">🔮 <b>${beaten ? U.esc(S.title) : 'Chefe do altar: ainda não derrotado'}</b>${beaten ? ` <small>derrotado ${beaten}×</small><p>${U.esc(S.lore)}</p>` : ''}</div>`;
      html += '</div>';
    }
    body.innerHTML = html;
    UI.open(el);
  };

  // ------------------------------------------------ mapa da região (com teletransporte entre estátuas)
  WU.regionMap = () => {
    const w = E.WG.world;
    if (!w || w.cave || !w.minimap) { E.Map.open(); return; }
    const el = UI.screen(`🗺 ${w.reg.name}`, { paper: false, right: '<button class="btn sm" data-a="atlas"><span class="ico">🌍</span>Mapa de Elarion</button>' });
    const body = el.querySelector('.screen-body');
    body.innerHTML = `<div class="rmap-wrap"><div class="rmap"><canvas></canvas><div class="rmap-pins"></div></div><div class="rmap-side"><p class="muted">Toque numa <b>estátua despertada</b> (✦ azul) para viajar até ela. Estátuas cinzentas despertam quando você chega perto.</p><div class="rmap-leg"></div></div></div>`;
    const cv = body.querySelector('canvas'), pins = body.querySelector('.rmap-pins');
    const size = w.size, S2 = 1;
    cv.width = w.minimap.width; cv.height = w.minimap.height;
    const x = cv.getContext('2d'); x.drawImage(w.minimap, 0, 0);
    // névoa fora da área jogável
    x.fillStyle = 'rgba(10,14,24,.55)'; x.beginPath(); x.rect(0, 0, cv.width, cv.height); x.arc(cv.width / 2, cv.height / 2, (w.bound / size) * cv.width, 0, Math.PI * 2, true); x.fill();
    const pct = (v) => ((v + size / 2) / size) * 100;
    const pin = (px, pz, cls, ico, title, onClick) => { const b = U.h(`<button class="rpin ${cls}" style="left:${pct(px)}%;top:${pct(pz)}%" title="${U.esc(title)}">${ico}</button>`); if (onClick) b.onclick = onClick; else b.disabled = true; pins.appendChild(b); return b; };
    const go = async (tx, tz) => { UI.close(el); await WU.teleport(tx, tz); };
    pin(w.waypoint.x, w.waypoint.z, 'tp on', '✦', 'Estátua central', () => go(w.waypoint.x + 2, w.waypoint.z + 2));
    for (const s of w.statueObjs || []) pin(s.x, s.z, `tp ${s.on ? 'on' : 'off'}`, '✦', s.on ? 'Viajar para esta estátua' : 'Estátua adormecida', s.on ? () => go(s.x + 2.2, s.z + 2.2) : null);
    for (const m of w.monumentObjs || []) pin(m.x, m.z, `mon ${W.isRead(w.id, m.i) ? 'read' : ''}`, '🏛', W.isRead(w.id, m.i) ? m.def.name : 'Monumento antigo');
    if (w.summonObj) pin(w.summonObj.x, w.summonObj.z, 'sum', '🔮', 'Altar de Invocação');
    if (w.lairBoss) pin(w.lairPos.x, w.lairPos.z, 'lair', '☠', 'Covil do chefe');
    if (w.extra && w.extra.cave && w.reg.caveId) pin(w.extra.cave.x, w.extra.cave.z, 'cave', '⛏', 'Gruta');
    if (w.extra && w.extra.domain) pin(w.extra.domain.x, w.extra.domain.z, 'dom', '🌀', 'Domínio');
    if (w.objective) pin(w.objective.x, w.objective.z, 'obj', '★', 'Objetivo da história');
    if (w.event && !w.event.done) pin(w.event.x, w.event.z, 'ev', w.event.def.icon, w.event.def.name);
    const me = pin(w.hero.x, w.hero.z, 'me', '●', 'Você');
    me.style.transform = 'translate(-50%,-50%)';
    const T = W.totals();
    body.querySelector('.rmap-leg').innerHTML = `<div>✦ Estátuas despertadas: <b>${1 + (w.statueObjs || []).filter((s) => s.on).length}/${1 + (w.statueObjs || []).length}</b></div><div>🏛 Monumentos lidos aqui: <b>${W.readCount(w.id)}/${W.monuments(w.id).length}</b></div><div>${W.STONE.icon} Pedras de Invocação: <b>${W.stones()}</b></div><div>📜 Crônicas: <b>${T.read}/${T.all}</b></div>${w.event && !w.event.done ? `<div class="evl">${w.event.def.icon} <b>${U.esc(w.event.def.name)}</b> em andamento!</div>` : ''}<button class="btn sm dark" data-a="chr"><span class="ico">📜</span>Crônicas</button>`;
    body.querySelector('[data-a=chr]').onclick = () => { UI.close(el); WU.chronicle(); };
    el.querySelector('[data-a=atlas]').onclick = () => { UI.close(el); E.Map.open(); };
    void S2;
    E.WG.locked = true;
    UI.open(el, () => { E.WG.locked = !!E.BattleUI.current; });
  };

  E.Wonders = WU;
})();
