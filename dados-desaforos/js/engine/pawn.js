/* Casa de Penhores da Galeria dos Mercadores (Aurenna) — mecânica do jogo. Você deixa uma arma como garantia e recebe
   ouro na hora; para resgatar, paga o empréstimo e mais 10%. A arma fica guardada inteira (nível, ascensão, refino e
   arte) em E.state.pawn até o resgate: nunca é vendida, não vence e não some ao recarregar. Cada operação é atômica:
   se o salvamento falhar, ouro, armas e cautelas voltam ao estado anterior. */
(() => {
  'use strict';
  const U = E.U;
  const PW = { MAX: 6, RATE: 0.6, FEE: 0.10 };
  const ok = (message, extra = {}) => Object.assign({ ok: true, message }, extra);
  const fail = (message) => ({ ok: false, message });

  PW.list = () => { if (!Array.isArray(E.state.pawn)) E.state.pawn = []; return E.state.pawn; };
  // Valor de referência: o que o armeiro pagaria; armas ★5 (que o armeiro não compra) valem 2500 po como garantia.
  PW.loan = (entry) => {
    const def = E.C.weaponDef(entry); if (!def) return 0;
    const base = def.rarity >= 5 ? 2500 : E.Forge.sellPrice(entry);
    return Math.max(5, Math.floor(base * PW.RATE));
  };
  PW.redeemCost = (t) => t.loan + Math.ceil(t.loan * PW.FEE);
  PW.why = (entry) => {
    if (!entry || !E.C.weaponDef(entry)) return 'Arma desconhecida.';
    if (E.G.isEquipped(entry.uid)) return 'Desequipe a arma antes de penhorar.';
    if (entry.lock) return 'Esta arma está travada.';
    if (PW.list().length >= PW.MAX) return `O balcão guarda no máximo ${PW.MAX} armas suas.`;
    return null;
  };
  const atomic = (fn) => {
    const snap = { weapons: E.state.weapons.slice(), pawn: PW.list().slice(), gold: new Map(E.state.heroes.map((h) => [h.id, h.gold])) };
    try { const r = fn(); E.Store.save(); return r; }
    catch (e) {
      E.state.weapons = snap.weapons; E.state.pawn = snap.pawn; for (const h of E.state.heroes) h.gold = snap.gold.get(h.id);
      try { E.Store.save(); } catch (e2) { /* o salvamento anterior continua valendo */ }
      return fail('Não foi possível salvar a operação. Nada mudou.');
    }
  };
  PW.pawn = (h, uid) => {
    const entry = E.Store.weapon(uid), why = PW.why(entry);
    if (!h) return fail('Nenhum personagem.');
    if (why) return fail(why);
    const loan = PW.loan(entry);
    return atomic(() => {
      const ticket = { id: U.uid(), entry: JSON.parse(JSON.stringify(entry)), loan, at: Date.now(), by: h.id };
      E.state.weapons = E.state.weapons.filter((w) => w.uid !== uid);
      PW.list().push(ticket); h.gold += loan;
      return ok(`${E.C.weaponDef(entry).name} ficou no penhor. Você recebeu ${loan} po.`, { loan, ticket });
    });
  };
  PW.redeem = (h, id) => {
    const t = PW.list().find((x) => x.id === id);
    if (!h || !t) return fail('Cautela não encontrada.');
    const cost = PW.redeemCost(t);
    if (!Number.isFinite(h.gold) || h.gold < cost) return fail(`Faltam ${cost - Math.max(0, h.gold | 0)} po para o resgate.`);
    return atomic(() => {
      const entry = t.entry;
      if (E.state.weapons.some((w) => w.uid === entry.uid)) entry.uid = U.uid(); // nunca duplica um identificador
      E.state.weapons.push(entry);
      E.state.pawn = PW.list().filter((x) => x !== t); h.gold -= cost;
      return ok(`${E.C.weaponDef(entry).name} voltou para o seu arsenal (${cost} po).`, { cost });
    });
  };

  // ---------------- balcão ----------------
  PW.open = () => {
    const UI = E.UI, h = E.Store.hero(); if (!h) return;
    const el = UI.screen('Casa de Penhores'), body = el.querySelector('.screen-body');
    const art = (def) => (E.WA ? E.WA.svg(def, { still: true }) : '');
    const draw = () => {
      const tickets = PW.list(), weapons = E.state.weapons.map((w) => ({ w, def: E.C.weaponDef(w) })).filter((x) => x.def).sort((a, b) => b.def.rarity - a.def.rarity);
      body.innerHTML = `<div style="max-width:860px;margin:auto"><div class="card"><b>Galeria dos Mercadores · balcão de penhores</b><p style="color:#5a6378;margin:6px 0 0">Deixe uma arma como garantia e receba ${Math.round(PW.RATE * 100)}% do valor dela na hora. Para resgatar, pague o empréstimo + ${Math.round(PW.FEE * 100)}%. A arma fica guardada inteira, sem prazo — nada vence nem é vendido. Ouro: <b>${h.gold} po</b>.</p></div>
        <h3 style="font-family:var(--display)">Suas cautelas (${tickets.length}/${PW.MAX})</h3><div data-t></div>
        <h3 style="font-family:var(--display)">Penhorar uma arma</h3><div data-w></div></div>`;
      const tl = body.querySelector('[data-t]'), wl = body.querySelector('[data-w]');
      if (!tickets.length) tl.appendChild(U.h('<p style="color:#5a6378">Nenhuma arma no penhor.</p>'));
      for (const t of tickets) {
        const def = E.C.weaponDef(t.entry), cost = PW.redeemCost(t);
        const row = U.h(`<div class="shop-item"><div class="si">${def ? art(def) : ''}</div><div class="sx"><b>${U.esc(def ? def.name : 'Arma')} · Nv. ${t.entry.lv || 1}</b><small>Empréstimo ${t.loan} po · resgate ${cost} po</small></div><button class="btn sm primary" ${h.gold < cost ? 'disabled' : ''}>Resgatar · ${cost} po</button></div>`);
        row.querySelector('button').onclick = () => { const r = PW.redeem(h, t.id); UI.toast(r.message, r.ok ? 'gold' : ''); if (r.ok && E.Audio) E.Audio.sfx('chest'); draw(); };
        tl.appendChild(row);
      }
      if (!weapons.length) wl.appendChild(U.h('<p style="color:#5a6378">Você não tem armas guardadas.</p>'));
      for (const { w, def } of weapons) {
        const why = PW.why(w), loan = PW.loan(w);
        const row = U.h(`<div class="shop-item"><div class="si">${art(def)}</div><div class="sx"><b>${U.esc(def.name)} · ${'★'.repeat(def.rarity)} · Nv. ${w.lv || 1}</b><small>${why ? U.esc(why) : `Recebe ${loan} po · resgate por ${loan + Math.ceil(loan * PW.FEE)} po`}</small></div><button class="btn sm dark" ${why ? 'disabled' : ''}>Penhorar · ${loan} po</button></div>`);
        row.querySelector('button').onclick = async () => {
          if (!await UI.confirm('Penhorar arma', `Deixar <b>${U.esc(def.name)}</b> como garantia por ${loan} po? Você pode resgatá-la quando quiser por ${loan + Math.ceil(loan * PW.FEE)} po.`, 'Penhorar', 'Cancelar')) return;
          const r = PW.pawn(h, w.uid); UI.toast(r.message, r.ok ? 'gold' : ''); if (r.ok && E.Audio) E.Audio.sfx('chest'); draw();
        };
        wl.appendChild(row);
      }
    };
    draw();
    UI.open(el);
  };
  E.Pawn = PW;
})();
