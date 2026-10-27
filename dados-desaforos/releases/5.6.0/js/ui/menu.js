/* Menu principal (estilo "Paimon"): perfil à esquerda, atalhos redondos à direita. */
(() => {
  const U = E.U, UI = E.UI, C = E.C;
  const MN = {};

  MN.open = () => {
    const h = E.Store.hero();
    if (!h) return;
    const st = E.state;
    const sig = `${C.species(h).name} ${C.cls(h).name.toLowerCase()} · ${E.H.BACKGROUNDS[h.background].name}. ${h.kills && Object.keys(h.kills).length ? `${Object.values(h.kills).reduce((a, b) => a + b, 0)} criaturas derrotadas.` : 'A jornada mal começou.'}`;
    const el = U.h(`<section id="menu" class="layer">
      <aside class="menu-side">
        <div class="profile"><div class="avatar"><img src="${UI.heroPortrait(h)}" alt=""></div><div><div class="pn">${U.esc(h.name)}</div><div class="pl">Nível ${h.level} · ${C.cls(h).name}</div><div class="uid">UID ${E.Net && E.Net.isActiveAccount && E.Net.isActiveAccount() ? E.Net.user.uid : st.uid}${E.Acc.current() ? ' · ' + U.esc(E.Acc.current().name) : ' · convidado'}</div></div></div>
        <div class="adv-strip"><div><b>Rank de Aventura ${E.Adv.ar()}</b><small>Nível de Mundo ${E.Adv.worldWL()}</small></div><div class="bar"><i style="width:${Math.min(100, E.Adv.data().xp / E.Adv.need(E.Adv.ar()) * 100)}%"></i></div><small>${E.Adv.data().xp} / ${E.Adv.need(E.Adv.ar())} EXP</small></div>
        <div class="sig">“${U.esc(sig)}”</div>
        <div class="wallet"><span class="cur"><span class="ci gem">💎</span>${st.gems}</span><span class="cur"><span class="ci seal">🌟</span>${st.seals}</span><span class="cur"><span class="ci gold">🪙</span>${h.gold} po</span></div>
        <div class="morgana-tip"><div class="mf">✧</div><div><b>Morgana diz:</b><br>${U.pick(E.WD.MORGANA.tips)}</div></div>
        <div style="margin-top:auto;display:flex;gap:10px;flex-wrap:wrap"><button class="btn dark sm" data-a="title"><span class="ico">⏻</span>Tela inicial</button><button class="btn sm" data-a="close"><span class="ico">✕</span>Voltar ao jogo</button></div>
      </aside>
      <div class="menu-shortcuts"><header class="menu-heading"><span>GUIA DO VIAJANTE</span><h2>Sua jornada em Elarion</h2><div class="menu-heading-line"></div></header><nav class="menu-grid" aria-label="Menu do viajante"></nav><div class="menu-caption">Explore. Construa um lar. Escreva sua lenda.</div></div>
    </section>`);
    const items = [
      ['character', 'Personagem', () => E.Sheet.open()],
      ['arsenal', 'Arsenal', () => E.Arsenal.open()],
      ['wardrobe', 'Guarda-roupa', () => E.Wardrobe.open()],
      ['oracle', 'Oráculo', () => E.Wish.open()],
      ['echoes', 'Ecos', () => E.EcoUI.open()],
      ['lifebook', 'Vida & Ofícios', () => E.LifeBook.open()],
      ['journal', 'Carteira de trabalho', () => E.Work.openCard()],
      ['home', 'Encontrar moradia', () => E.WorldServices ? E.WorldServices.guide('home') : E.Settlements.open()],
      ['scales', 'Minha Loja', () => E.Vendor.open()],
      ['cooking', 'Comida & Viagem', () => E.WorldServices ? E.WorldServices.foodBag() : E.Sim.openFood()],
      ['calendar', 'Calendário', () => E.Sim.openCalendar()],
      ['quest', 'Missões', () => E.Journal.quests()],
      ['map', 'Mapa', () => E.Wonders.regionMap()],
      ['chronicle', 'Crônicas', () => E.Wonders.chronicle()],
      ['inventory', 'Inventário', () => E.Journal.inventory()],
      ['bestiary', 'Bestiário', () => E.Journal.bestiary()],
      ['heroes', 'Heróis', () => E.Journal.heroes()],
      ['rules', 'Regras 5.5', () => E.Journal.rules()],
      ['adventure', 'Aventura', () => E.Journal.adventure()],
      ['coop', 'Cooperativo', () => E.Online.panel()],
      ['account', 'Conta', () => E.Online.openAccount()],
      ['settings', 'Ajustes', () => E.Journal.settings()],
    ];
    const grid = el.querySelector('.menu-grid');
    items.forEach(([ic, n, fn], i) => {
      const b = U.h(`<button class="mi" style="animation-delay:${i * 0.03}s"><span class="mc">${E.Icons.html(ic, { decorative: true })}</span><span class="mi-label">${n}</span></button>`);
      b.setAttribute('aria-label', n);
      b.onclick = () => { UI.close(el); fn(); };
      grid.appendChild(b);
    });
    el.querySelector('[data-a=close]').onclick = () => UI.close(el);
    el.querySelector('[data-a=title]').onclick = async () => { if (await UI.confirm('Voltar à tela inicial?', 'Seu progresso é salvo automaticamente.')) { E.Store.save(); location.reload(); } };
    el.addEventListener('pointerdown', (e) => { if (e.target === el) UI.close(el); });
    E.WG.locked = true;
    UI.open(el, () => { E.WG.locked = false; });
  };

  E.Menu = MN;
})();
