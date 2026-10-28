/* Integração com o aplicativo Android (APK): botão voltar, pausa ao minimizar, compartilhar e vibração.
   No navegador quase tudo aqui fica inativo; E.App.buzz usa navigator.vibrate quando existe. */
(() => {
  const U = E.U, UI = E.UI;
  const bridge = window.ElarionApp || null;
  const App = { native: !!bridge };

  App.buzz = (ms = 30) => {
    if (E.state && E.state.settings && E.state.settings.vibrate === false) return;
    try { if (bridge) bridge.vibrate(ms); else if (navigator.vibrate) navigator.vibrate(ms); } catch { /* sem vibração */ }
  };
  App.share = (title, text) => { if (!bridge) return false; bridge.share(title, text); return true; };
  App.open = (url) => { if (bridge) bridge.openUrl(url); else open(url, '_blank', 'noopener'); };

  if (bridge) {
    document.documentElement.classList.add('native-app');
    // voltar do Android: fecha o que estiver aberto, senão abre o menu; na tela inicial sai (com dois toques)
    window.ElarionBack = () => {
      const modal = document.querySelector('.modal-bg[data-dismiss]');
      if (modal && UI._modalClose) { UI._modalClose(null); return; }
      if (document.querySelector('.modal-bg, #dialog, .death-roll, .wish-anim, .reveal, .summary')) return;
      if (E.BattleUI && E.BattleUI.current && !UI.anyOpen()) { UI.toast('A batalha ainda não acabou!'); return; }
      const inWorld = E.WG && E.WG.mode && E.WG.mode() === 'world' && document.getElementById('hud');
      if (!UI.anyOpen() && !inWorld) { bridge.backExit(); return; }
      dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', cancelable: true }));
    };
    window.ElarionPause = () => {
      try { E.Store.save(); } catch { /* */ }
      if (E.Audio.suspend) E.Audio.suspend();
      if (E.Net && E.Net.user && E.Net.cloudSave) E.Net.cloudSave().catch(() => {});
    };
    window.ElarionResume = () => { if (E.Audio.resume) E.Audio.resume(); };
  }

  // no navegador e no app: o som para quando o jogo vai para segundo plano
  addEventListener('visibilitychange', () => { if (document.hidden) { if (E.Audio.suspend) E.Audio.suspend(); } else if (E.Audio.resume) E.Audio.resume(); });

  E.App = App;
})();
