# Progresso da atualização (checkpoints)

Projeto Vercel: `dados-desaforos-elarion` (time `kojomiguel445-5477`). O código veio do deploy
de produção 5.3.1 (`dpl_B1hjBGYCHBUraYPjSFCMqfxEdFXA`), conferido por SHA-1 (commit 6133d8e).

## Como publicar (sem Git ligado ao Vercel)
1. `node tools/release.mjs <x.y.z>` (versão nova; adicione `<script>` novos ao index.html antes).
2. `python3 tools/deploy_plan.py <x.y.z> <pasta>`
   - a base (último deploy de produção) e as versões que ela contém ficam em `tools/deploy-base.json`;
3. `create_deployment` com os arquivos de `<pasta>/deploy-files.json` (prévia primeiro, depois
   `target: production` referenciando os mesmos SHA). O build (`tools/build.mjs`) baixa a base
   imutável, aplica as diferenças e confere cada arquivo por SHA-1.
   O build confere por SHA-1 tanto as diferenças quanto os arquivos novos enviados (`sums`).
4. Testes locais: `python3 -m http.server 8765` na pasta e `node tests/harness.cjs <roteiro> <saída>`.

## Etapas
- [x] 1. Mundo (5.3.2, em produção): construções assentadas, vilas niveladas, placas legíveis,
  transição cidade-natureza. **Pendente:** vila do Bosque continua na encosta (23 m) para não
  alterar a floresta; mudar exige trocar `w.reg.biome!=='forest'` em `villages.js` (layout).
- [x] 2. HUD (5.4.0, em produção): HUD e menus translúcidos, marcador de interação, recuo quando parado, transições
- [x] 3. Pesca (5.5.0, em produção): pesca sentada em bancos, tensão da linha, varas com atributos, raridades, peixes de mar aberto, revelação de raros
- [x] 4. Carteira de trabalho e entrevista (5.6.0, em produção): carteira no menu, um emprego por vez (inclusive
  saves antigos/duplicados), convite do responsável, sala dos fundos com os dois sentados e entrevista
  livre avaliada por regras (`js/engine/employment.js`, `js/gfx/workplace.js`, `tests/plan-work.json`).
  Sem servidor de jogo neste projeto Vercel: a validação roda no motor do cliente, não num servidor.
- [x] 5. Trabalho no caixa (5.7.0, em produção): salão do empório (`js/gfx/shopfloor.js`), ponto na área dos
  funcionários, posto atrás do balcão, 5 clientes que entram/escolhem/fazem fila/pagam/saem, registro
  dos itens, conta, gaveta e troco em moedas (1 po = 10 pp); regras e salário diário em `employment.js`
  (`tests/plan-cashier.json`). Outros estabelecimentos podem ganhar catálogo em `E.Work.CATALOG`.
- [x] 6. Moradias (5.8.0, em produção): painel Personalizar casa (`js/gfx/homedecor.js`, `css/home.css`) com compra,
  posição, giro e guarda de móveis; sofá, TV, geladeira, armário e bancada; papéis de parede e pisos com
  prévia ao vivo; grade de 25 cm e regra única de posição `SS.canPlaceFurniture` (paredes, porta, bancada,
  outros móveis) usada pela prévia e pelo motor; só o morador edita (`tests/plan-home.json`).
- [x] 5.9.0 (em produção): guilda e diárias por personagem; entrevista/turno presos ao personagem;
  HUD mais próximo de Genshin (grupo de personagens com troca 1-4, menu redondo, ícones soltos,
  barra de vida fina, faixa com nome da área, UID).
