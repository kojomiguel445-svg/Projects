/* Tela inicial no estilo Genshin: cenário 3D animado, logotipo e "Toque para começar". */
(() => {
  const U = E.U, UI = E.UI;
  const T = {};
  T.VERSION = '5.6.0';

  T.show = () => {
    E.WG.showTitle();
    E.Audio.music('calma');
    const el = U.h(`<section id="title" class="layer">
      <div class="logo">
        <div class="l1">Dados <em>&amp;</em> Desaforos</div>
        <div class="orn"><i></i>✦<i></i></div>
        <div class="l2">CRÔNICAS DE ELARION</div>
      </div>
      <div class="tap">TOQUE PARA COMEÇAR</div>
      <div class="title-foot">
        <div class="left">
          <button class="icon-btn" data-a="settings" aria-label="Configurações">⚙</button>
          <button class="icon-btn" data-a="credits" aria-label="Créditos e licença">ⓘ</button>
          <button class="btn sm dark tf-btn" data-a="online"><span class="ico">👤</span><span data-online-label>Entrar / Criar conta</span></button>
          ${E.App.native || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches ? '' : '<button class="btn sm dark tf-btn" data-a="install"><span class="ico">⬇</span>Instalar app</button>'}
        </div>
        <div style="text-align:right"><a class="title-apk" href="/baixar.html">Baixar para Android</a><br>Versão ${T.VERSION} · Regras D&amp;D 5.5 (SRD 5.2)<br>UID ${E.state.uid}</div>
      </div>
    </section>`);
    el.querySelector('[data-a=settings]').onclick = (e) => { e.stopPropagation(); E.Journal.settings(); };
    el.querySelector('[data-a=credits]').onclick = (e) => { e.stopPropagation(); T.credits(); };
    const inst = el.querySelector('[data-a=install]');
    if (inst) inst.onclick = (e) => { e.stopPropagation(); E.Game.install(); };
    el.querySelector('[data-a=online]').onclick = (e) => { e.stopPropagation(); E.Online.openAccount(); };
    const acc = E.Acc.current();
    if (acc) el.querySelector('[data-online-label]').textContent = `${acc.name} · ${acc.kind === 'cloud' ? 'online' : 'local'}`;
    else if (E.Acc.decided()) el.querySelector('[data-online-label]').textContent = 'Convidado · Entrar';
    el.addEventListener('click', (event) => {
      if (event.target.closest('a')) return;
      if (UI.anyOpen() || document.querySelector('.modal-bg')) return;
      // primeira vez: escolhe conta (local ou online) ou joga como convidado
      if (!E.Acc.decided()) { E.Online.openAccount({ onDone: () => T.enter(el) }); return; }
      T.enter(el);
    });
    UI.root().appendChild(el);
  };

  T.enter = async (el) => {
    E.Audio.unlock();
    E.Audio.sfx('wish');
    const door = U.h('<div class="door"><i></i></div>');
    document.body.appendChild(door);
    requestAnimationFrame(() => door.classList.add('go'));
    await U.wait(900);
    const flash = U.h('<div class="flash go"></div>');
    document.body.appendChild(flash);
    await U.wait(300);
    el.remove();
    door.remove();
    setTimeout(() => flash.remove(), 900);
    E.WG.disposeTitle();
    const hero = E.Store.hero();
    if (hero && !hero.dead) E.Game.enterWorld();
    else if (E.state.heroes.some((h) => !h.dead && !h.deleted)) { E.state.activeHero = E.state.heroes.find((h) => !h.dead && !h.deleted).id; E.Game.enterWorld(); }
    else E.Creator.open();
  };

  T.credits = () => UI.modal({
    title: 'Créditos e Licença',
    html: `<div style="font-size:13px;line-height:1.6;color:#4a5366">
      <p><b>Dados &amp; Desaforos — Crônicas de Elarion</b> é um RPG de fã inspirado em Dungeons &amp; Dragons 5.5 (2024).</p>
      <p>Este trabalho inclui material do <i>System Reference Document 5.2</i> (“SRD 5.2”) da Wizards of the Coast LLC, disponível em <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener">dndbeyond.com/srd</a>. O SRD 5.2 está licenciado sob a <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noopener">Creative Commons Atribuição 4.0 Internacional</a>.</p>
      <p>Regras resumidas e adaptadas para combate por turnos solo. Dungeons &amp; Dragons é marca da Wizards of the Coast; este projeto não é oficial nem afiliado.</p>
      <p>Gráficos 3D com <b>three.js</b> (licença MIT). Arte em pixel, dados e música gerados por código.</p>
      <p>O sistema de desejos (gacha) usa apenas moedas do próprio jogo — não há compras com dinheiro real.</p></div>`,
    buttons: [{ label: 'Fechar', value: true, cls: 'primary' }],
  });

  E.Title = T;
})();
