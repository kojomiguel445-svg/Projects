# Progresso da atualização (checkpoints)

Projeto Vercel: `dados-desaforos-elarion` (time `kojomiguel445-5477`). O código veio do deploy
de produção 5.3.1 (`dpl_B1hjBGYCHBUraYPjSFCMqfxEdFXA`), conferido por SHA-1 (commit 6133d8e).

## Como publicar (sem Git ligado ao Vercel)
1. `node tools/release.mjs <x.y.z>` (versão nova; adicione `<script>` novos ao index.html antes).
2. `python3 tools/deploy_plan.py <x.y.z> <pasta> <versões-anteriores=url ...>`
   - versões anteriores: `5.3.0` e `5.3.1` vêm da base; `5.3.2` está em
     `https://dados-desaforos-elarion-mp7v4phqm-kojomiguel445-5477.vercel.app`.
3. `create_deployment` com os arquivos de `<pasta>/deploy-files.json` (prévia primeiro, depois
   `target: production` referenciando os mesmos SHA). O build (`tools/build.mjs`) baixa a base
   imutável, aplica as diferenças e confere cada arquivo por SHA-1.
4. Testes locais: `python3 -m http.server 8765` na pasta e `node tests/harness.cjs <roteiro> <saída>`.

## Etapas
- [x] 1. Mundo (5.3.2, em produção): construções assentadas, vilas niveladas, placas legíveis,
  transição cidade-natureza. **Pendente:** vila do Bosque continua na encosta (23 m) para não
  alterar a floresta; mudar exige trocar `w.reg.biome!=='forest'` em `villages.js` (layout).
- [ ] 2. HUD
- [ ] 3. Pesca
- [ ] 4. Carteira de trabalho e entrevista
- [ ] 5. Trabalho no caixa
- [ ] 6. Moradias
