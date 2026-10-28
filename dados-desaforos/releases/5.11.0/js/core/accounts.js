/* Contas do jogador.
   • Conta local: fica no próprio aparelho, protegida por senha (funciona offline, inclusive no app Android).
   • Conta online: criada no servidor do jogo (banco de dados SQLite), com UID, amigos, correio e salvamento na nuvem.
   • Convidado: joga sem conta (o progresso fica só neste aparelho).
   Cada conta tem o próprio salvamento; trocar de conta recarrega o jogo com o progresso dela. */
(() => {
  const U = E.U;
  const KEY = 'elarion-accounts';
  const A = { data: U.load(KEY, { list: [], current: null, chosen: false }) };
  const persist = () => U.save(KEY, A.data);
  A.saveKey = () => (A.data.current ? `elarion-save-v1:${A.data.current}` : 'elarion-save-v1');
  A.current = () => A.data.list.find((a) => a.id === A.data.current) || null;
  A.locals = () => A.data.list.filter((a) => a.kind === 'local');
  // já escolheu como jogar (conta ou convidado)?
  A.decided = () => !!A.current() || A.data.chosen;
  A.playAsGuest = () => { A.data.current = null; A.data.chosen = true; persist(); };

  // ---------- senha: PBKDF2 (WebCrypto) com reserva em SHA-256 puro ----------
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  function sha256(str) {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const bytes = [...new TextEncoder().encode(str)], l = bytes.length * 8;
    bytes.push(0x80); while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : (l >>> (i * 8)) & 0xff);
    let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const r = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < bytes.length; o += 64) {
      const w = [];
      for (let i = 0; i < 16; i++) w[i] = (bytes[o + i * 4] << 24) | (bytes[o + i * 4 + 1] << 16) | (bytes[o + i * 4 + 2] << 8) | bytes[o + i * 4 + 3];
      for (let i = 16; i < 64; i++) { const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const t1 = (hh + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h = h.map((v, i) => (v + [a, b, c, d, e, f, g, hh][i]) | 0);
    }
    return h.map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
  }
  const hashPw = async (pw, salt) => {
    try {
      if (crypto && crypto.subtle) {
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
        return 'p2:' + hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256));
      }
    } catch { /* sem WebCrypto: usa a reserva */ }
    let v = salt + ':' + pw; for (let i = 0; i < 4000; i++) v = sha256(v + salt);
    return 's2:' + v;
  };
  const check = async (acc, pw) => {
    if (acc.hash.startsWith('s2:') && !(crypto && crypto.subtle)) return (await hashPw(pw, acc.salt)) === acc.hash;
    if (acc.hash.startsWith('s2:')) { let v = acc.salt + ':' + pw; for (let i = 0; i < 4000; i++) v = sha256(v + acc.salt); return 's2:' + v === acc.hash; }
    return (await hashPw(pw, acc.salt)) === acc.hash;
  };
  const NAME_RE = /^[\p{L}\p{N}_ .-]{3,16}$/u;
  const newUid = () => String(100000000 + Math.floor(U.rand() * 899999999));

  // ---------- contas locais ----------
  A.createLocal = async (name, pw, { adoptGuest } = {}) => {
    name = String(name || '').trim();
    if (!NAME_RE.test(name)) throw new Error('Nome: 3 a 16 letras, números, espaço, ponto, hífen ou _.');
    if (String(pw).length < 4) throw new Error('A senha precisa ter pelo menos 4 caracteres.');
    if (A.data.list.some((a) => a.kind === 'local' && a.name.toLowerCase() === name.toLowerCase())) throw new Error('Já existe uma conta local com esse nome.');
    const salt = U.uid() + U.uid();
    const acc = { id: 'L' + newUid(), kind: 'local', name, salt, hash: await hashPw(pw, salt), created: Date.now(), last: Date.now() };
    acc.uid = acc.id.slice(1);
    A.data.list.push(acc);
    // o progresso de convidado deste aparelho pode virar o progresso da conta
    const guest = localStorage.getItem('elarion-save-v1');
    if (adoptGuest && guest) { try { const d = JSON.parse(guest); d.uid = acc.uid; localStorage.setItem(`elarion-save-v1:${acc.id}`, JSON.stringify(d)); } catch { /* */ } }
    A.data.current = acc.id; A.data.chosen = true;
    persist();
    return acc;
  };
  A.loginLocal = async (id, pw) => {
    const acc = A.data.list.find((a) => a.id === id);
    if (!acc) throw new Error('Conta não encontrada.');
    if (!(await check(acc, pw))) throw new Error('Senha incorreta.');
    acc.last = Date.now(); A.data.current = acc.id; A.data.chosen = true; persist();
    return acc;
  };
  A.changeLocalPassword = async (old, pw) => {
    const acc = A.current(); if (!acc || acc.kind !== 'local') throw new Error('Sem conta local ativa.');
    if (!(await check(acc, old))) throw new Error('Senha atual incorreta.');
    if (String(pw).length < 4) throw new Error('A nova senha precisa ter pelo menos 4 caracteres.');
    acc.salt = U.uid() + U.uid(); acc.hash = await hashPw(pw, acc.salt); persist();
  };
  A.removeLocal = async (id, pw) => {
    const acc = A.data.list.find((a) => a.id === id); if (!acc) return;
    if (!(await check(acc, pw))) throw new Error('Senha incorreta.');
    A.data.list = A.data.list.filter((a) => a.id !== id);
    try { localStorage.removeItem(`elarion-save-v1:${id}`); } catch { /* */ }
    if (A.data.current === id) A.data.current = null;
    persist();
  };

  // ---------- contas online (servidor) ----------
  A.useCloud = (user) => {
    const id = 'C' + user.uid;
    let acc = A.data.list.find((a) => a.id === id);
    if (!acc) { acc = { id, kind: 'cloud', uid: String(user.uid), name: user.name, created: user.created || Date.now() }; A.data.list.push(acc); }
    acc.name = user.name; acc.last = Date.now();
    A.data.current = id; A.data.chosen = true; persist();
    return acc;
  };
  A.hasSave = (id) => { try { return !!localStorage.getItem(`elarion-save-v1:${id}`); } catch { return false; } };
  A.writeSave = (id, json) => { try { localStorage.setItem(`elarion-save-v1:${id}`, json); return true; } catch { return false; } };

  A.logout = () => { A.data.current = null; A.data.chosen = false; persist(); };
  // recarrega o jogo com o salvamento da conta atual
  A.restart = () => { try { E.Store && E.Store.data && E.Store.save(); } catch { /* */ } setTimeout(() => location.reload(), 60); };
  A.switchTo = (id) => { try { E.Store.save(); } catch { /* */ } A.data.current = id; A.data.chosen = true; persist(); A.restart(); };

  E.Acc = A;
})();
