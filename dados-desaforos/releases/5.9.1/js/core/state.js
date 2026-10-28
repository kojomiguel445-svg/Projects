/* Estado do jogo e salvamento local. */
(() => {
  const U = E.U;
  // cada conta tem o próprio salvamento (ver accounts.js); sem conta, o salvamento de convidado
  const KEY = () => (E.Acc ? E.Acc.saveKey() : 'elarion-save-v1');

  const fresh = () => ({
    v: 1,
    uid: String(100000000 + Math.floor(U.rand() * 899999999)),
    created: Date.now(),
    gems: 1600,
    seals: 10,
    pity: {
      evento: { p5: 0, p4: 0, g5: false, g4: false },
      padrao: { p5: 0, p4: 0 },
    },
    history: [],
    weapons: [],
    heroes: [],
    activeHero: null,
    story: { chapter: 0, flags: [], ready: false, complete: false },
    quests: {},
    world: { region: 'bosque', pos: null, opened: {}, gathered: {}, cleared: {}, waypoints: { bosque: true }, visited: { bosque: true } },
    materials: {},
    settings: { master: 0.7, music: 0.5, sfx: 0.8, reducedMotion: false, quality: U.isTouch() ? 'medio' : 'alto', adaptiveResolution: true, hardcore: false, diceSpeed: 1, vibrate: true },
    stats: { wins: 0, crits: 0, wishes: 0, deaths: 0 },
    tutorial: { seen: {} },
  });

  const S = {
    data: null,
    load() {
      const d = U.load(KEY(), null);
      this.data = d && d.v === 1 ? Object.assign(fresh(), d) : fresh();
      const acc = E.Acc && E.Acc.current();
      if (acc && acc.uid) this.data.uid = acc.uid;
      // migrações leves
      const f = fresh();
      for (const k of Object.keys(f.world)) if (this.data.world[k] === undefined) this.data.world[k] = f.world[k];
      for (const k of Object.keys(f.settings)) if (this.data.settings[k] === undefined) this.data.settings[k] = f.settings[k];
      E.state = this.data;
      return this.data;
    },
    save() {
      if (this.data) U.save(KEY(), this.data);
    },
    reset() {
      this.data = fresh();
      E.state = this.data;
      this.save();
    },
    hero() {
      const d = this.data;
      return d.heroes.find((h) => h.id === d.activeHero && !h.deleted) || null;
    },
    weapon(uid) {
      return this.data.weapons.find((w) => w.uid === uid) || null;
    },
    addWeapon(id, opts = {}) {
      const w = { uid: U.uid(), id, refine: 1, got: Date.now(), lock: false, custom: opts.custom || null };
      this.data.weapons.push(w);
      return w;
    },
    exportSave() {
      return btoa(unescape(encodeURIComponent(JSON.stringify(this.data))));
    },
    importSave(str) {
      const d = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
      if (!d || d.v !== 1) throw new Error('Arquivo de salvamento inválido.');
      this.data = Object.assign(fresh(), d);
      E.state = this.data;
      this.save();
    },
  };

  // salva periodicamente e ao sair
  setInterval(() => S.save(), 15000);
  addEventListener('beforeunload', () => S.save());
  addEventListener('visibilitychange', () => { if (document.hidden) S.save(); });

  E.Store = S;
})();
