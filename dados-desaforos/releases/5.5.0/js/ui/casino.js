/* Cassino Fortuna Dourada (Aurenna): caça-níquel com jackpot, vinte-e-um, roleta e "Dados do Desaforo".
   Aposta-se com fichas compradas com ouro. A casa sempre ganha no longo prazo — dá para falir. */
(() => {
  const U = E.U, UI = E.UI;
  const CA = {};
  const SLOT = [
    { s: '🍒', w: 30, pay: 8 }, { s: '🍋', w: 25, pay: 10 }, { s: '🔔', w: 18, pay: 15 }, { s: '⭐', w: 12, pay: 30 },
    { s: '💎', w: 7, pay: 60 }, { s: '7️⃣', w: 5, pay: 120 }, { s: '🐉', w: 3, pay: 'J' },
  ];
  const RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const PRIZES = [
    { id: 'gems', name: '30 Gemas Estelares', icon: '💎', cost: 200, give: () => { E.state.gems += 30; } },
    { id: 'seal', name: '1 Selo Estelar', icon: '🌟', cost: 1500, give: () => { E.state.seals += 1; } },
    { id: 'potion', name: 'Poção de Cura Maior', icon: '🧪', cost: 250, give: (h) => { h.inventory.pocao_maior = (h.inventory.pocao_maior || 0) + 1; } },
    { id: 'outfit', name: 'Traje: Terno do Apostador', icon: '🎩', cost: 5000, once: true, give: () => { E.state.outfits = E.state.outfits || {}; E.state.outfits.apostador = true; } },
  ];
  const pickSlot = () => { const t = SLOT.reduce((a, s) => a + s.w, 0); let r = U.rand() * t; for (const s of SLOT) { r -= s.w; if (r <= 0) return s; } return SLOT[0]; };

  CA.open = (options = {}) => {
    const h = E.Store.hero(); const d = E.Life.data(h);
    E.state.jackpot = E.state.jackpot || 1500;
    const el = UI.screen('🎰 Cassino Fortuna Dourada', { paper: false, cls: 'casino', right: '<span class="chip gold" data-gold></span><span class="chip chipc" data-chips></span>' });
    const body = el.querySelector('.screen-body');
    let game = options.game || 'lobby', bet = 10;
    const head = () => { el.querySelector('[data-gold]').textContent = `🪙 ${h.gold} po`; el.querySelector('[data-chips]').textContent = `🟡 ${d.chips} fichas`; };
    const broke = async () => {
      if (h.gold <= 0 && d.chips <= 0) {
        d.stats.broke++; E.Life.checkAch(h); E.Store.save();
        if(options.atTable){UI.toast('Sem fichas. A mesa continua aqui quando você quiser voltar.');return;}
        await UI.alert('Você faliu!', 'Nenhuma moeda, nenhuma ficha. O segurança acompanha você gentilmente até a porta… Talvez pescar, minerar ou vender mercadorias ajude a recomeçar.', 'Que vergonha');
      }
    };
    const placeBet = (b) => {
      if (d.chips < b) { UI.toast('Fichas insuficientes. Troque ouro por fichas no caixa.'); return false; }
      d.chips -= b; E.Life.addXp(h, 'jogatina', Math.min(12, 1 + Math.round(b / 20))); E.Life.ev('bet'); head(); return true;
    };
    const win = (n, msg) => { d.chips += n; head(); if (msg) UI.toast(msg, 'gold'); E.Store.save(); };
    const betBar = (onChange) => {
      const w = U.h(`<div class="cs-bet"><span>Aposta:</span>${[5, 10, 25, 50, 100, 250].map((v) => `<button class="${v === bet ? 'on' : ''}" data-v="${v}">${v}</button>`).join('')}</div>`);
      w.querySelectorAll('button').forEach((b) => (b.onclick = () => { bet = Number(b.dataset.v); w.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); onChange && onChange(); }));
      return w;
    };
    const back = () => { const b = U.h(`<button class="btn sm dark cs-back">${options.atTable?'Levantar da mesa':'Salão'}</button>`); b.onclick = () => { if(options.atTable)return E.WorldServices.close();game = 'lobby'; draw(); }; return b; };

    const draw = () => {
      head();
      body.innerHTML = '';
      if (game === 'lobby') return lobby();
      body.appendChild(back());
      ({ slots, bj, roleta, dados, caixa, premios })[game]();
    };
    const lobby = () => {
      body.innerHTML = `<div class="cs-hero"><div class="cs-neon">FORTUNA DOURADA</div><div class="cs-sub">“A sorte sorri para quem aposta — e gargalha de quem aposta tudo.”</div><div class="cs-jp">JACKPOT ACUMULADO <b>${E.state.jackpot}</b> fichas</div></div><div class="cs-grid"></div><p class="muted cs-warn">Jogatina Nv. ${E.Life.level(h, 'jogatina')} · Fichas valem 1 po. A casa tem vantagem em todos os jogos.</p>`;
      const grid = body.querySelector('.cs-grid');
      [['caixa', '💱', 'Caixa', 'Trocar ouro ↔ fichas'], ['slots', '🎰', 'Caça-níquel do Dragão', 'Três 🐉 ganham o jackpot'], ['bj', '🃏', 'Vinte-e-Um', 'Chegue a 21 sem estourar'], ['roleta', '🎡', 'Roleta Europeia', 'Cor, dúzia ou número'], ['dados', '🎲', 'Dados do Desaforo', '2d6: acima, abaixo ou 7'], ['premios', '🎁', 'Balcão de Prêmios', 'Gemas, selos e um traje']].forEach(([id, ic, n, s]) => {
        const b = U.h(`<button class="cs-card"><span class="ci">${ic}</span><b>${n}</b><small>${s}</small></button>`);
        b.onclick = () => { game = id; draw(); E.Audio.sfx('click'); };
        grid.appendChild(b);
      });
    };
    // -------- caixa
    const caixa = () => {
      const box = U.h(`<div class="cs-table"><h3>💱 Caixa</h3><p>1 po = 1 ficha. Você pode trocar de volta sem taxa.</p><div class="cs-row"></div><div class="cs-row out"></div></div>`);
      [50, 100, 500, 1000].forEach((v) => { const b = U.h(`<button class="btn sm primary">Comprar ${v}</button>`); b.onclick = () => { if (h.gold < v) return UI.toast('Ouro insuficiente.'); h.gold -= v; d.chips += v; E.Store.save(); head(); }; box.querySelector('.cs-row').appendChild(b); });
      const all = U.h('<button class="btn sm dark">Trocar todas as fichas por ouro</button>'); all.onclick = () => { h.gold += d.chips; d.chips = 0; E.Store.save(); head(); };
      box.querySelector('.out').appendChild(all);
      body.appendChild(box);
    };
    // -------- caça-níquel
    const slots = () => {
      const box = U.h(`<div class="cs-table slotm"><div class="cs-jp">JACKPOT <b>${E.state.jackpot}</b></div><div class="reels"><div class="reel">🍒</div><div class="reel">🔔</div><div class="reel">7️⃣</div></div><div class="cs-msg">Três iguais pagam. Dois 🍒 devolvem o dobro.</div><div class="cs-pay">${SLOT.map((s) => `<span>${s.s}${s.s}${s.s} ${s.pay === 'J' ? 'JACKPOT' : '×' + s.pay}</span>`).join('')}<span>🍒🍒 ×2</span></div></div>`);
      body.appendChild(box);
      body.appendChild(betBar());
      const spin = U.h('<button class="btn primary cs-go"><span class="ico">🎰</span>Girar</button>');
      body.appendChild(spin);
      let busy = false;
      spin.onclick = async () => {
        if (busy || !placeBet(bet)) return;
        busy = true;
        E.state.jackpot += Math.ceil(bet * 0.05);
        const res = [pickSlot(), pickSlot(), pickSlot()];
        const reels = [...box.querySelectorAll('.reel')];
        reels.forEach((r) => r.classList.add('spin'));
        E.Audio.sfx('dice', 3);
        for (let i = 0; i < 3; i++) {
          const until = performance.now() + 500 + i * 380;
          while (performance.now() < until) { reels[i].textContent = U.pick(SLOT).s; await U.wait(55); }
          reels[i].textContent = res[i].s; reels[i].classList.remove('spin'); E.Audio.sfx('hit');
        }
        const msg = box.querySelector('.cs-msg');
        let pay = 0;
        if (res[0].s === res[1].s && res[1].s === res[2].s) {
          if (res[0].pay === 'J') { pay = E.state.jackpot; E.state.jackpot = 1500; d.stats.jackpots++; E.Audio.sfx('levelup'); msg.innerHTML = `<b class="big">🐉 JACKPOT! +${pay} fichas!</b>`; }
          else { pay = bet * res[0].pay; msg.innerHTML = `<b>Três ${res[0].s}! +${pay} fichas</b>`; E.Audio.sfx('crit'); }
        } else if (res.filter((r) => r.s === '🍒').length === 2) { pay = bet * 2; msg.innerHTML = `<b>Dois 🍒 — +${pay}</b>`; E.Audio.sfx('chest'); }
        else msg.textContent = 'Nada desta vez…';
        if (pay) win(pay);
        box.querySelector('.cs-jp b').textContent = E.state.jackpot;
        E.Life.checkAch(h); E.Store.save();
        busy = false;
        broke();
      };
    };
    // -------- vinte-e-um
    const bj = () => {
      const box = U.h('<div class="cs-table felt"><div class="bj-hand dealer"><span class="bj-l">Crupiê</span><div class="cards"></div><span class="bj-v"></span></div><div class="bj-hand player"><span class="bj-l">Você</span><div class="cards"></div><span class="bj-v"></span></div><div class="cs-msg">Faça sua aposta.</div><div class="cs-row acts"></div></div>');
      body.appendChild(box);
      body.appendChild(betBar());
      let deck = [], P = [], D = [], stake = 0, phase = 'bet';
      const newDeck = () => { deck = []; for (let k = 0; k < 4; k++) for (const s of ['♠', '♥', '♦', '♣']) for (const r of ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']) deck.push({ r, s }); deck = U.shuffle(deck); };
      const val = (cards) => { let v = 0, a = 0; for (const c of cards) { if (c.r === 'A') { a++; v += 11; } else v += ['J', 'Q', 'K'].includes(c.r) ? 10 : Number(c.r); } while (v > 21 && a) { v -= 10; a--; } return v; };
      const card = (c, hidden) => hidden ? '<div class="pc back"></div>' : `<div class="pc ${'♥♦'.includes(c.s) ? 'red' : ''}"><b>${c.r}</b><span>${c.s}</span></div>`;
      const render = (hideHole) => {
        box.querySelector('.dealer .cards').innerHTML = D.map((c, i) => card(c, hideHole && i === 1)).join('');
        box.querySelector('.player .cards').innerHTML = P.map((c) => card(c)).join('');
        box.querySelector('.player .bj-v').textContent = P.length ? val(P) : '';
        box.querySelector('.dealer .bj-v').textContent = D.length ? (hideHole ? '?' : val(D)) : '';
      };
      const acts = (list) => { const row = box.querySelector('.acts'); row.innerHTML = ''; for (const [t, fn, cls] of list) { const b = U.h(`<button class="btn sm ${cls || 'primary'}">${t}</button>`); b.onclick = fn; row.appendChild(b); } };
      const finish = async (msg, payout) => {
        phase = 'bet'; render(false);
        box.querySelector('.cs-msg').innerHTML = msg;
        if (payout) { win(payout); E.Audio.sfx('chest'); } else E.Audio.sfx('fail');
        acts([['Nova mão', deal]]);
        E.Life.checkAch(h); E.Store.save();
        broke();
      };
      const dealerPlay = async () => {
        render(false);
        while (val(D) < 17) { await U.wait(450); D.push(deck.pop()); render(false); E.Audio.sfx('click'); }
        const pv = val(P), dv = val(D);
        if (dv > 21) return finish(`Crupiê estourou (${dv})! Você ganha <b>+${stake * 2}</b>.`, stake * 2);
        if (pv > dv) return finish(`${pv} contra ${dv}: você ganha <b>+${stake * 2}</b>!`, stake * 2);
        if (pv === dv) return finish(`Empate em ${pv}. Aposta devolvida.`, stake);
        return finish(`${dv} contra ${pv}: a casa vence.`, 0);
      };
      const deal = () => {
        if (!placeBet(bet)) return;
        stake = bet; if (deck.length < 20) newDeck();
        P = [deck.pop(), deck.pop()]; D = [deck.pop(), deck.pop()]; phase = 'play';
        render(true); E.Audio.sfx('click');
        if (val(P) === 21) { d.stats.blackjacks++; const pay = Math.floor(stake * 2.5); return val(D) === 21 ? finish('Dois Blackjacks — empate.', stake) : finish(`<b>BLACKJACK!</b> Paga 3:2 → <b>+${pay}</b>`, pay); }
        box.querySelector('.cs-msg').textContent = 'Pedir carta ou parar?';
        acts([['Pedir', hit], ['Parar', () => dealerPlay(), 'dark'], ...(d.chips >= stake ? [['Dobrar', double, 'dark']] : [])]);
      };
      const hit = () => { if (phase !== 'play') return; P.push(deck.pop()); render(true); E.Audio.sfx('click'); if (val(P) > 21) finish(`Estourou com ${val(P)}…`, 0); else if (val(P) === 21) dealerPlay(); else acts([['Pedir', hit], ['Parar', () => dealerPlay(), 'dark']]); };
      const double = () => { if (d.chips < stake) return; d.chips -= stake; stake *= 2; head(); P.push(deck.pop()); render(true); if (val(P) > 21) finish(`Dobrou e estourou com ${val(P)}…`, 0); else dealerPlay(); };
      newDeck(); render(false);
      acts([['Distribuir', deal]]);
    };
    // -------- roleta
    const roleta = () => {
      const box = U.h(`<div class="cs-table felt roleta"><canvas width="300" height="300"></canvas><div class="rl-side"><div class="cs-msg">Escolha uma aposta e gire.</div><div class="rl-bets"></div><div class="rl-num"><span>Número:</span><input type="number" min="0" max="36" value="17"></div></div></div>`);
      body.appendChild(box);
      body.appendChild(betBar());
      const cv = box.querySelector('canvas'), x = cv.getContext('2d');
      let rot = 0, choice = 'vermelho';
      const drawWheel = (ball) => {
        x.clearRect(0, 0, 300, 300); x.save(); x.translate(150, 150);
        x.beginPath(); x.arc(0, 0, 146, 0, 7); x.fillStyle = '#6a3a1a'; x.fill();
        const n = WHEEL.length, a0 = (Math.PI * 2) / n;
        for (let i = 0; i < n; i++) {
          const v = WHEEL[i], a = rot + i * a0 - Math.PI / 2;
          x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 132, a - a0 / 2, a + a0 / 2); x.closePath();
          x.fillStyle = v === 0 ? '#1f8a4c' : RED.includes(v) ? '#b8242c' : '#1a1a1e'; x.fill();
          x.save(); x.rotate(a); x.fillStyle = '#fff'; x.font = 'bold 11px sans-serif'; x.textAlign = 'center'; x.fillText(String(v), 118, 4); x.restore();
        }
        x.beginPath(); x.arc(0, 0, 70, 0, 7); x.fillStyle = '#3a2410'; x.fill(); x.strokeStyle = '#d4af37'; x.lineWidth = 3; x.stroke();
        for (let i = 0; i < 4; i++) { x.save(); x.rotate(rot * 2 + i * Math.PI / 2); x.fillStyle = '#d4af37'; x.fillRect(-3, -60, 6, 50); x.restore(); }
        if (ball != null) { x.beginPath(); x.arc(Math.cos(ball) * 100, Math.sin(ball) * 100, 6, 0, 7); x.fillStyle = '#fff'; x.fill(); }
        x.restore();
        x.fillStyle = '#ffd36b'; x.beginPath(); x.moveTo(150, 4); x.lineTo(142, -8 + 20); x.lineTo(158, 12); x.fill();
      };
      drawWheel();
      const bets = [['vermelho', 'Vermelho 1:1'], ['preto', 'Preto 1:1'], ['par', 'Par 1:1'], ['impar', 'Ímpar 1:1'], ['baixo', '1–18 1:1'], ['alto', '19–36 1:1'], ['d1', '1ª dúzia 2:1'], ['d2', '2ª dúzia 2:1'], ['d3', '3ª dúzia 2:1'], ['num', 'Número 35:1']];
      const bb = box.querySelector('.rl-bets');
      bets.forEach(([id, n]) => { const b = U.h(`<button class="${id === choice ? 'on' : ''}">${n}</button>`); b.onclick = () => { choice = id; bb.querySelectorAll('button').forEach((y) => y.classList.toggle('on', y === b)); }; bb.appendChild(b); });
      const go = U.h('<button class="btn primary cs-go"><span class="ico">🎡</span>Girar a roleta</button>');
      body.appendChild(go);
      let busy = false;
      go.onclick = async () => {
        if (busy || !placeBet(bet)) return;
        busy = true;
        const num = Number(box.querySelector('input').value);
        const resIdx = Math.floor(U.rand() * WHEEL.length), res = WHEEL[resIdx];
        const n = WHEEL.length, a0 = (Math.PI * 2) / n;
        const startRot = rot, endRot = startRot + Math.PI * 2 * 4 + ((-(resIdx * a0) - startRot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const t0 = performance.now(), dur = 3400;
        E.Audio.sfx('dice', 4);
        await new Promise((r) => { const tick = (now) => { const k = Math.min(1, (now - t0) / dur), e = U.ease.outQuint(k); rot = startRot + (endRot - startRot) * e; drawWheel(-Math.PI / 2 - (1 - e) * 20); if (k < 1) requestAnimationFrame(tick); else r(); }; requestAnimationFrame(tick); });
        const red = RED.includes(res);
        const won = { vermelho: res && red, preto: res && !red, par: res && res % 2 === 0, impar: res % 2 === 1, baixo: res >= 1 && res <= 18, alto: res >= 19, d1: res >= 1 && res <= 12, d2: res >= 13 && res <= 24, d3: res >= 25, num: res === num }[choice];
        const mult = choice === 'num' ? 36 : choice.startsWith('d') ? 3 : 2;
        const msg = box.querySelector('.cs-msg');
        msg.innerHTML = `Saiu <b class="rn ${res === 0 ? 'g' : red ? 'r' : 'b'}">${res}</b>. ${won ? `Você ganhou <b>+${bet * mult}</b>!` : 'A casa leva.'}`;
        if (won) { win(bet * mult); E.Audio.sfx(choice === 'num' ? 'levelup' : 'chest'); } else E.Audio.sfx('fail');
        E.Store.save(); busy = false; broke();
      };
    };
    // -------- dados do desaforo (com os dados 3D)
    const dados = () => {
      const box = U.h('<div class="cs-table felt"><h3>🎲 Dados do Desaforo</h3><p>Dois d6 rolados na sua frente. Acima de 7 ou abaixo de 7 pagam 1:1; exatamente 7 paga 4:1; dupla paga 4:1.</p><div class="rl-bets dd"></div><div class="cs-msg"></div></div>');
      body.appendChild(box);
      body.appendChild(betBar());
      let choice = 'acima';
      const bb = box.querySelector('.dd');
      [['acima', 'Acima de 7'], ['abaixo', 'Abaixo de 7'], ['sete', 'Exatamente 7'], ['dupla', 'Dupla']].forEach(([id, n]) => { const b = U.h(`<button class="${id === choice ? 'on' : ''}">${n}</button>`); b.onclick = () => { choice = id; bb.querySelectorAll('button').forEach((y) => y.classList.toggle('on', y === b)); }; bb.appendChild(b); });
      const go = U.h('<button class="btn primary cs-go"><span class="ico">🎲</span>Rolar os dados</button>');
      body.appendChild(go);
      let busy = false;
      go.onclick = async () => {
        if (busy || !placeBet(bet)) return;
        busy = true;
        const a = U.die(6), b = U.die(6), s = a + b;
        const won = { acima: s > 7, abaixo: s < 7, sete: s === 7, dupla: a === b }[choice];
        const mult = choice === 'sete' || choice === 'dupla' ? 5 : 2;
        await E.Dice.roll({ dice: [{ s: 6, v: a, theme: 'gold' }, { s: 6, v: b, theme: 'gold' }], label: 'Dados do Desaforo', html: `<div class="dl-line">${a} + ${b} = ${s}</div><div class="dl-out ${won ? 'success' : 'fail'}">${won ? 'GANHOU' : 'PERDEU'}</div>`, outcome: won ? 'success' : 'fail' });
        E.Dice.hide();
        box.querySelector('.cs-msg').innerHTML = won ? `Deu ${s}! <b>+${bet * mult}</b> fichas.` : `Deu ${s}. A casa agradece.`;
        if (won) win(bet * mult);
        E.Store.save(); busy = false; broke();
      };
    };
    // -------- prêmios
    const premios = () => {
      const box = U.h('<div class="cs-table"><h3>🎁 Balcão de Prêmios</h3><p>Troque fichas por prêmios (as fichas trocadas não voltam).</p></div>');
      for (const p of PRIZES) {
        const owned = p.once && !!(E.state.outfits || {}).apostador;
        const row = U.h(`<div class="shop-item dark"><div class="si">${p.icon}</div><div class="sx"><b>${p.name}</b><small>${owned ? 'Você já tem' : `${p.cost} fichas`}</small></div><button class="btn sm primary" ${owned ? 'disabled' : ''}>Trocar</button></div>`);
        row.querySelector('button').onclick = () => { if (d.chips < p.cost) return UI.toast('Fichas insuficientes.'); d.chips -= p.cost; p.give(h); UI.loot(p.icon, p.name); E.Store.save(); draw(); };
        box.appendChild(row);
      }
      body.appendChild(box);
    };
    draw();
    if(options.atTable&&E.WorldServices){
      el.className='casino at-world-table';const chip=el.querySelector('[data-chips]');el.insertBefore(chip,body);
      const title=({bj:'Mesa de Vinte-e-Um',slots:'Máquina do Dragão',premios:'Prêmios do balcão'})[game]||'Mesa Fortuna Dourada';
      const card=E.WorldServices.open({title,icon:game==='bj'?'cards':'casino',anchor:options.anchor,text:'A mesa fica aqui no salão. Use as fichas do caixa para jogar.',onClose:()=>el.remove()});card.querySelector('.ws-content').appendChild(el);
    }else UI.open(el);
  };

  E.Casino = CA;
})();
