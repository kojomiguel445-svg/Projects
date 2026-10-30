/* Subclasses escolhidas no nível 3, resumidas para o combate de Elarion.
   As marcadas com srd: true têm referência no SRD 5.2.1; as demais têm atribuição ao Livro do Jogador 2024
   ainda pendente de conferência contra o texto oficial completo. Ausência no SRD não indica conteúdo inventado.
   O que depende de mapa, deslocamento ou exploração aparece só como descrição. "Só aliados" = afeta outras criaturas
   (no cooperativo, os aliados do grupo).
   Característica: [nível, id, nome, descrição, efeitos]. Os efeitos (fx) são interpretados pelo motor de combate:
     hitDmg {dice, type, alt (tipo alternativo se o alvo resistir), once, halfLvl, when:{raging, finesse, melee, ranged, hurt}}
     startTemp · resist [tipos] · rageResistAll · condImm [condições] · condImmRage · saveAdvVs [fear|charm] · saveProf
     init (número ou atributo) · initAdv · unarmored (atributo somado à CA sem armadura) · hpPerLevel
     spellDmgMod {schools|types, ab} · extraAttack · weapons · armor · warMagic · firstRoundAdv · assassinate
     wardingFlare · improvedFlare · portent · arcaneWard · illusorySelf · multiDefense · psiShield · retaliate
     heroicEachTurn · cancelEnemyAdv · hiddenSpellDis · homing · wildMagic · bendLuck · wildForm {tempMult, acBase}
     moonRadiant · saveAbBonus {ab: atributo} · rageTemp · lifeGiving · batteringRoots · fanaticalFocus · smiteTemp
     guidedStrike · maneuvers · psiStrike · psiTopple · harmHand · harmPoison · grantSpells [[nível, id...]] · caster
     danceUnarmed · tandemFootwork · beguilingMagic · saveRescue · mistyEscape · beguilingDefenses · psychicSpells
     eldritchHex · thoughtShield · stormborn · cosmicOmen · dreadfulStrike · fleeAdv · elemAttune · supremeSneak
   Poderes (botões no combate): { id, lvl, name, icon, desc, cost: 'a'|'b'|'free', res, use, effect, needAllies } */
(() => {
  const H = E.H;
  const mod = (h, ab) => E.C.mod(h, ab);
  const pos = (n) => Math.max(1, n);
  const ma = (h) => (h.level >= 11 ? 10 : h.level >= 5 ? 8 : 6); // dado de Artes Marciais
  const insp = (h) => (h.level >= 15 ? 12 : h.level >= 10 ? 10 : h.level >= 5 ? 8 : 6); // dado de Inspiração Bárdica

  H.SUB_LEVEL = 3;
  H.SUB_DEFAULT = { barbaro: 'berserker', bardo: 'conhecimento', bruxo: 'infero', clerigo: 'vida', druida: 'terra', guerreiro: 'campeao', ladino: 'ladrao', feiticeiro: 'draconico', mago: 'evocador', monge: 'mao_aberta', paladino: 'devocao', patrulheiro: 'cacador' };

  H.SUBCLASSES = {
    // ======================================================== BÁRBARO
    barbaro: {
      berserker: { name: 'Caminho do Berserker', icon: '🪓', srd: true, blurb: 'Fúria pura, sem freio: cada golpe descuidado vira uma tempestade de dano.',
        features: [
          [3, 'frenesi', 'Frenesi', 'Se usar Ataque Descuidado em Fúria, o primeiro alvo que você acertar no turno sofre dano extra: d6s iguais ao seu bônus de dano de Fúria.'],
          [6, 'furia_irracional', 'Fúria Irracional', 'Em Fúria você é imune a Amedrontado e Enfeitiçado (entrar em Fúria encerra essas condições).', { condImmRage: ['amedrontado', 'enfeiticado'] }],
          [10, 'retaliacao', 'Retaliação', 'Reação: quando uma criatura a até 1,5 m causa dano a você, faça um ataque corpo a corpo contra ela.', { retaliate: true }],
        ] },
      coracao_selvagem: { name: 'Caminho do Coração Selvagem', icon: '🐻', blurb: 'O espírito do urso, da águia e do lobo corre nas suas veias.',
        features: [
          [3, 'fala_animais', 'Orador dos Animais', 'Conjura Falar com Animais e Sentido Animal como rituais (exploração).'],
          [3, 'furia_feras', 'Fúria da Natureza · Urso', 'Ao entrar em Fúria você escolhe um animal; Elarion usa o Urso: Resistência a todo dano, exceto Energia, Necrótico, Psíquico e Radiante. (Águia: Desengajar e Disparada; Lobo: aliados com Vantagem — opções de deslocamento e de grupo.)', { rageResistAll: true }],
          [6, 'aspecto_natureza', 'Aspecto da Natureza', 'Coruja (Visão no Escuro), Pantera (escalada) ou Salmão (natação) — exploração.'],
          [10, 'orador_natureza', 'Orador da Natureza', 'Conjura Comunhão com a Natureza como ritual (exploração).'],
        ] },
      arvore_mundo: { name: 'Caminho da Árvore do Mundo', icon: '🌳', blurb: 'Suas raízes tocam todos os planos e sustentam quem luta ao seu lado.',
        features: [
          [3, 'vitalidade_arvore', 'Vitalidade da Árvore', 'Surto de Vitalidade: ao entrar em Fúria, ganha PV temporários iguais ao seu nível de Bárbaro. Força Vital (só aliados): no início de cada turno em Fúria, um aliado ganha PV temporários (d6s = bônus de dano de Fúria).', { rageTemp: true, lifeGiving: true }],
          [6, 'galhos_arvore', 'Galhos da Árvore', 'Em Fúria, Reação quando uma criatura começa o turno a até 9 m: TR de Força ou é teleportada para perto de você e fica com Deslocamento 0 (posicionamento — sem efeito no combate em fila).'],
          [10, 'raizes_esmagadoras', 'Raízes Golpeadoras', 'Seu alcance aumenta com armas Pesadas ou Versáteis e, ao acertar com elas, você ativa também a Maestria Derrubar (TR de Constituição ou Caído), além da Maestria da arma.', { batteringRoots: true }],
        ] },
      zelote: { name: 'Caminho do Zelote', icon: '✴', blurb: 'Um deus da guerra luta através de você — e se recusa a deixar você cair.',
        features: [
          [3, 'furia_divina', 'Fúria Divina', 'Em Fúria, a primeira criatura que você acertar em cada turno sofre +1d6 + metade do nível de Bárbaro (Necrótico ou Radiante, à sua escolha).', { hitDmg: { dice: '1d6', halfLvl: true, type: 'radiante', alt: 'necrotico', once: true, when: { raging: true } } }],
          [3, 'guerreiro_deuses', 'Guerreiro dos Deuses', 'Reserva de d12 (4; 5 no nível 6): Ação Bônus para gastar dados e recuperar PV iguais ao total.'],
          [6, 'foco_fanatico', 'Foco Fanático', 'Uma vez por Fúria, ao falhar num teste de resistência, rerrola somando seu bônus de dano de Fúria.', { fanaticalFocus: true }],
          [10, 'presenca_zelosa', 'Presença Zelosa', 'Ação Bônus (1×/Descanso Longo): até dez outras criaturas (só aliados) têm Vantagem em ataques e testes de resistência até o início do seu próximo turno.'],
        ],
        resources: { zelo: (h) => (h.level >= 12 ? 6 : h.level >= 6 ? 5 : 4), zelosa: (h) => (h.level >= 10 ? 1 : 0) },
        powers: [
          { id: 'guerreiro_deuses', lvl: 3, name: 'Guerreiro dos Deuses', icon: '💛', desc: 'Cura 2d12 (gasta 2 dados da reserva)', cost: 'b', res: 'zelo', use: (h) => Math.min(2, E.C.res(h, 'zelo')), effect: { heal: (h, n) => `${n}d12` } },
          { id: 'presenca_zelosa', lvl: 10, name: 'Presença Zelosa', icon: '📯', desc: 'Aliados com Vantagem em ataques e TRs', cost: 'b', res: 'zelosa', needAllies: true, effect: { allyAdv: 1 } },
        ] },
    },

    // ======================================================== BARDO
    bardo: {
      conhecimento: { name: 'Colégio do Conhecimento', icon: '📚', srd: true, blurb: 'Sabe um pouco de tudo — inclusive como desmontar um ataque com uma frase.',
        features: [
          [3, 'proficiencias_bonus', 'Proficiências Adicionais', 'Proficiência em três perícias à sua escolha.'],
          [3, 'palavras_cortantes', 'Palavras Cortantes', 'Reação: quando uma criatura acerta um ataque, gaste Inspiração Bárdica e subtraia o dado da jogada.'],
          [6, 'descobertas_magicas', 'Descobertas Mágicas', 'Aprende duas magias das listas de Clérigo, Druida ou Mago (Elarion: Mísseis Mágicos e Bola de Fogo).', { grantSpells: [[6, 'misseis_magicos', 'bola_fogo']] }],
        ] },
      danca: { name: 'Colégio da Dança', icon: '💃', blurb: 'Luta como quem dança: leve, imprevisível e impossível de acertar.',
        features: [
          [3, 'rodopio_deslumbrante', 'Passos Deslumbrantes', 'Sem armadura nem escudo: CA = 10 + DES + CAR; seus Golpes Desarmados usam DES e causam dano de Concussão = dado de Inspiração + DES (sem gastar o dado).', { unarmored: 'car', danceUnarmed: true }],
          [6, 'movimento_inspirador', 'Movimento Inspirador', 'Reação para se mover junto de um aliado quando um inimigo termina o turno perto (deslocamento).'],
          [6, 'passos_tandem', 'Passos em Conjunto', 'Ao rolar Iniciativa, gaste uma Inspiração Bárdica e some o dado à Iniciativa (sua e dos aliados próximos). Em Elarion é usado sozinho quando você tem 2+ usos.', { tandemFootwork: true }],
        ] },
      glamour: { name: 'Colégio do Glamour', icon: '🧚', blurb: 'Encanto feérico: sua presença aquece aliados e deixa inimigos de joelhos.',
        features: [
          [3, 'magia_sedutora', 'Magia Sedutora', 'Enfeitiçar Pessoa e Imagem Espelhada sempre preparadas. Logo depois de conjurar uma magia de Encantamento ou Ilusão com espaço, uma criatura faz TR de Sabedoria ou fica Amedrontada (1×/Descanso Longo, ou gaste Inspiração).', { grantSpells: [[3, 'enfeiticar_pessoa', 'imagem_espelhada']], beguilingMagic: true }],
          [3, 'manto_inspiracao', 'Manto de Inspiração', 'Ação Bônus: gaste Inspiração; outras criaturas (até CAR) ganham PV temporários = 2 × o dado (só aliados).'],
          [6, 'manto_majestade', 'Manto de Majestade', 'Ação Bônus (1×/Descanso Longo): conjura Comando sem espaço e, por 1 minuto, pode conjurar Comando como Ação Bônus sem espaço.', { grantSpells: [[6, 'comando']] }],
        ],
        resources: { fascinio: () => 1, majestade: (h) => (h.level >= 6 ? 1 : 0) },
        powers: [
          { id: 'manto_inspiracao', lvl: 3, name: 'Manto de Inspiração', icon: '✨', desc: 'Aliados ganham PV temporários = 2 × dado de Inspiração', cost: 'b', res: 'inspiracao', needAllies: true, effect: { allyTemp: (h) => `1d${insp(h)}`, allyMult: 2 } },
          { id: 'manto_majestade', lvl: 6, name: 'Manto de Majestade', icon: '👑', desc: 'Comando grátis agora e como Ação Bônus por 10 rodadas', cost: 'b', res: 'majestade', effect: { buff: 'majesty', rounds: 10, target: { save: 'sab', cond: 'caido' } } },
          { id: 'comando_majestoso', lvl: 6, name: 'Comando Majestoso', icon: '🗣', desc: '“Rasteje!”: TR Sab ou Caído', cost: 'b', needBuff: 'majesty', effect: { target: { save: 'sab', cond: 'caido' } } },
        ] },
      valor: { name: 'Colégio do Valor', icon: '🛡', blurb: 'Bardos que cantam na linha de frente, de escudo erguido.',
        features: [
          [3, 'inspiracao_combate', 'Inspiração em Combate', 'Quem tem um dado de Inspiração seu pode somá-lo à CA (Reação) ou ao dano (só aliados).'],
          [3, 'treino_marcial', 'Treinamento Marcial', 'Proficiência com armas marciais, armadura média e escudos; armas servem de foco de conjuração.', { weapons: 'marcial', armor: ['media', 'escudo'] }],
          [6, 'ataque_extra_bardo', 'Ataque Extra', 'Ataca duas vezes ao usar a ação Atacar e pode trocar um dos ataques por um truque.', { extraAttack: true, warMagic: true }],
        ] },
    },

    // ======================================================== BRUXO
    bruxo: {
      infero: { name: 'Patrono Ínfero', icon: '😈', srd: true, blurb: 'Um pacto com os planos inferiores: cada inimigo caído alimenta você.',
        features: [
          [3, 'bencao_sombrio', 'Bênção do Sombrio', 'Ao reduzir um inimigo a 0 PV, ganha PV temporários = CAR + nível de Bruxo. Magias do Ínfero sempre preparadas: Mãos Flamejantes, Comando, Raio Ardente; Bola de Fogo, Névoa Fétida; Escudo de Fogo, Muralha de Fogo; Praga de Insetos.', { grantSpells: [[3, 'maos_flamejantes', 'comando', 'raio_ardente'], [5, 'bola_fogo', 'nevoa_fetida'], [7, 'escudo_fogo', 'muralha_fogo'], [9, 'praga_insetos']] }],
          [6, 'sorte_sombrio', 'Sorte do Próprio Sombrio', 'Depois de ver um teste de resistência, some 1d10 (CAR vezes por Descanso Longo).', { saveRescue: '1d10' }],
          [10, 'resiliencia_infera', 'Resiliência Ínfera', 'Resistência a um tipo de dano escolhido em cada descanso (Elarion: Fogo).', { resist: ['fogo'] }],
        ],
        resources: { sorte_sombria: (h) => (h.level >= 6 ? pos(mod(h, 'car')) : 0) } },
      arquifada: { name: 'Patrono Arquifada', icon: '🦋', blurb: 'Uma rainha das fadas te ensinou a sumir e reaparecer sorrindo.',
        features: [
          [3, 'passos_feericos', 'Passos Feéricos', 'Conjura Passo Nebuloso sem espaço (CAR vezes/Descanso Longo); ao conjurar, Passo Revigorante: você ganha 1d10 PV temporários. Magias sempre preparadas: Sono, Passo Nebuloso, Fogo das Fadas; Invisibilidade Maior no 7.', { grantSpells: [[3, 'sono', 'passo_nebuloso', 'fogo_fadas'], [7, 'invisibilidade_maior']] }],
          [6, 'fuga_nebulosa', 'Fuga Nebulosa', 'Reação ao sofrer dano: conjura Passo Nebuloso (gasta um Passo Feérico) com Passo Aterrador — o atacante faz TR de Sabedoria ou sofre 2d10 Psíquico. Usado quando você cai abaixo da metade dos PV.', { mistyEscape: true }],
          [10, 'defesas_sedutoras', 'Defesas Sedutoras', 'Imune a Enfeitiçado. Reação (1×/Descanso Longo) depois de ser atingido: reduz o dano à metade e o atacante faz TR de Sabedoria ou sofre Psíquico igual ao dano que você sofreu.', { condImm: ['adormecido'], beguilingDefenses: true }],
        ],
        resources: { passo_feerico: (h) => pos(mod(h, 'car')), defesas: (h) => (h.level >= 10 ? 1 : 0) },
        powers: [{ id: 'passos_feericos', lvl: 3, name: 'Passo Feérico', icon: '🦋', desc: 'Passo Nebuloso grátis + 1d10 PV temporários', cost: 'b', res: 'passo_feerico', effect: { temp: () => '1d10' } }] },
      celestial: { name: 'Patrono Celestial', icon: '😇', blurb: 'Um ser de luz pura partilha com você o poder de curar e queimar.',
        features: [
          [3, 'luz_curativa', 'Luz Curativa', 'Reserva de d6 (1 + nível); Ação Bônus: cura gastando até CAR dados. Magias sempre preparadas: Auxílio, Curar Ferimentos, Raio Guia, Restauração Menor, Chama Sagrada; Guardião da Fé e Muralha de Fogo no 7.', { grantSpells: [[3, 'auxilio', 'curar_ferimentos', 'raio_guia', 'restauracao_menor', 'chama_sagrada'], [7, 'guardiao_fe', 'muralha_fogo']] }],
          [6, 'alma_radiante', 'Alma Radiante', 'Resistência a Radiante; 1×/turno, quando sua magia causa Fogo ou Radiante, some CAR ao dano.', { resist: ['radiante'], spellDmgMod: { types: ['radiante', 'fogo'], ab: 'car' } }],
          [10, 'resiliencia_celestial', 'Resiliência Celestial', 'Ganha PV temporários = nível + CAR ao terminar um descanso ou usar Astúcia Mágica (Elarion: no início de cada combate).', { startTemp: (h) => h.level + mod(h, 'car') }],
        ],
        resources: { luz: (h) => 1 + h.level },
        powers: [{ id: 'luz_curativa', lvl: 3, name: 'Luz Curativa', icon: '🌟', desc: 'Cura até CAR d6 da reserva', cost: 'b', res: 'luz', use: (h) => Math.min(pos(mod(h, 'car')), E.C.res(h, 'luz')), effect: { heal: (h, n) => `${n}d6` } }] },
      grande_antigo: { name: 'Patrono Grande Antigo', icon: '🐙', blurb: 'Algo enorme sonha além das estrelas — e sussurra segredos na sua mente.',
        features: [
          [3, 'mente_desperta', 'Mente Desperta e Feitiços Psíquicos', 'Telepatia. Suas magias de Bruxo que causam dano podem causar Psíquico no lugar (Elarion troca quando o alvo resiste). Magias sempre preparadas: Sussurros Dissonantes, Riso Histérico; Fome de Hadar.', { psychicSpells: true, grantSpells: [[3, 'sussurros', 'riso_histerico'], [5, 'fome_hadar']] }],
          [6, 'combatente_clarividente', 'Combatente Clarividente', 'Ao criar um vínculo telepático (Ação Bônus, 1×/Descanso Curto), o alvo faz TR de Sabedoria; se falhar, você tem Vantagem contra ele e ele tem Desvantagem contra você.'],
          [10, 'maldicao_mistica', 'Maldição Mística', 'Maldição sempre preparada; o alvo da sua Maldição tem Desvantagem nos TR de Sabedoria.', { eldritchHex: true, grantSpells: [[10, 'maldicao']] }],
          [10, 'escudo_pensamento', 'Escudo do Pensamento', 'Resistência a dano Psíquico; quem causar dano Psíquico a você sofre a mesma quantidade.', { resist: ['psiquico'], thoughtShield: true }],
        ],
        resources: { clarividente: (h) => (h.level >= 6 ? 1 : 0) },
        powers: [{ id: 'combatente_clarividente', lvl: 6, name: 'Combatente Clarividente', icon: '👁', desc: 'TR Sab: Vantagem contra o alvo e ele com Desvantagem contra você', cost: 'b', res: 'clarividente', effect: { clair: true } }] },
    },

    // ======================================================== CLÉRIGO
    clerigo: {
      vida: { name: 'Domínio da Vida', icon: '💗', srd: true, blurb: 'O poder de manter todos de pé, custe o que custar.',
        features: [
          [3, 'discipulo_vida', 'Discípulo da Vida', 'Magias com espaço que curam recuperam 2 + círculo PV a mais. Magias sempre preparadas: Auxílio, Bênção, Curar Ferimentos, Restauração Menor; Palavra Curativa em Massa; Proteção contra a Morte; Curar Ferimentos em Massa.', { grantSpells: [[3, 'auxilio', 'bencao', 'curar_ferimentos', 'restauracao_menor'], [5, 'palavra_curativa_massa'], [7, 'protecao_morte'], [9, 'curar_massa']] }],
          [3, 'preservar_vida', 'Preservar a Vida', 'Canalizar Divindade (Ação): restaura até 5 × nível PV, divididos entre criaturas Sangrando, sem passar da metade dos PV máximos.'],
          [6, 'curandeiro_abencoado', 'Curandeiro Abençoado', 'Quando sua magia cura outra criatura, você recupera 2 + círculo PV (só aliados).'],
        ],
        powers: [{ id: 'preservar_vida', lvl: 3, name: 'Preservar a Vida', icon: '💗', desc: 'Cura até 5 × nível (só até metade dos PV)', cost: 'a', res: 'canalizar', req: (h) => h.hp < Math.floor(E.C.maxHp(h) / 2), reqTxt: 'Só com menos da metade dos PV', effect: { heal: (h) => `${Math.max(0, Math.min(5 * h.level, Math.floor(E.C.maxHp(h) / 2) - h.hp))}` } }] },
      luz: { name: 'Domínio da Luz', icon: '☀', blurb: 'O sol nasce na palma da sua mão — e cega quem ousa te atacar.',
        features: [
          [3, 'labareda_protetora', 'Labareda Protetora', 'Reação (SAB vezes/Descanso Longo): impõe Desvantagem a um ataque contra você. Magias sempre preparadas: Mãos Flamejantes, Fogo das Fadas, Raio Ardente; Bola de Fogo; Muralha de Fogo; Coluna de Chamas.', { wardingFlare: true, grantSpells: [[3, 'maos_flamejantes', 'fogo_fadas', 'raio_ardente'], [5, 'bola_fogo'], [7, 'muralha_fogo'], [9, 'coluna_chamas']] }],
          [3, 'radiancia_alvorada', 'Radiância da Alvorada', 'Canalizar Divindade (Ação): inimigos fazem TR de CON ou sofrem 2d10 + nível Radiante (metade se passarem).'],
          [6, 'labareda_aprimorada', 'Labareda Aprimorada', 'Recupera a Labareda em Descanso Curto, e o alvo protegido pela Labareda ganha 2d6 + SAB PV temporários.', { improvedFlare: true }],
        ],
        resources: { labareda: (h) => pos(mod(h, 'sab')) },
        powers: [{ id: 'radiancia_alvorada', lvl: 3, name: 'Radiância da Alvorada', icon: '🌅', desc: '2d10 + nível Radiante em todos · TR Con', cost: 'a', res: 'canalizar', effect: { aoe: { dice: (h) => `2d10+${h.level}`, type: 'radiante', save: 'con', half: true } } }] },
      trapaca: { name: 'Domínio da Trapaça', icon: '🃏', blurb: 'Um deus brincalhão te empresta um duplo ilusório e um sorriso torto.',
        features: [
          [3, 'bencao_trapaceiro', 'Bênção do Trapaceiro', 'Vantagem em Furtividade para uma criatura (exploração). Magias sempre preparadas: Enfeitiçar Pessoa, Invisibilidade; Padrão Hipnótico; Porta Dimensional.', { grantSpells: [[3, 'enfeiticar_pessoa', 'invisibilidade'], [5, 'padrao_hipnotico'], [7, 'porta_dimensional']] }],
          [3, 'invocar_duplicidade', 'Invocar Duplicidade', 'Canalizar Divindade (Ação Bônus): uma ilusão sua por 1 minuto; com você e o duplo perto de um alvo, você tem Vantagem nos ataques contra ele.'],
          [6, 'transposicao', 'Transposição do Trapaceiro', 'Ao criar ou mover o duplo, pode trocar de lugar com ele (deslocamento).'],
        ],
        powers: [{ id: 'invocar_duplicidade', lvl: 3, name: 'Invocar Duplicidade', icon: '👥', desc: 'Vantagem nos ataques por 10 rodadas', cost: 'b', res: 'canalizar', effect: { buff: 'dup', rounds: 10 } }] },
      guerra: { name: 'Domínio da Guerra', icon: '⚔', blurb: 'O sacerdote que reza com a espada na mão.',
        features: [
          [3, 'ataque_guiado', 'Ataque Guiado', 'Canalizar Divindade: ao errar um ataque, some +10 à jogada. Magias sempre preparadas: Raio Guia, Arma Mágica, Escudo da Fé, Arma Espiritual; Manto do Cruzado, Guardiões Espirituais; Escudo de Fogo; Imobilizar Monstro, Ataque do Aço Ventoso.', { guidedStrike: true, grantSpells: [[3, 'raio_guia', 'arma_magica', 'escudo_fe', 'arma_espiritual'], [5, 'manto_cruzado', 'guardioes_espirituais'], [7, 'escudo_fogo'], [9, 'imobilizar_monstro', 'ataque_aco_vento']] }],
          [3, 'sacerdote_guerra', 'Sacerdote da Guerra', 'Ação Bônus (SAB vezes, volta em Descanso Curto): um ataque com arma ou Golpe Desarmado.'],
          [6, 'bencao_deus_guerra', 'Bênção do Deus da Guerra', 'Gaste Canalizar Divindade para conjurar Escudo da Fé ou Arma Espiritual sem espaço e sem Concentração.'],
        ],
        resources: { sacerdote: (h) => pos(mod(h, 'sab')) },
        powers: [
          { id: 'sacerdote_guerra', lvl: 3, name: 'Sacerdote da Guerra', icon: '⚔', desc: 'Ataque com arma como Ação Bônus', cost: 'b', res: 'sacerdote', effect: { weaponAttack: true } },
          { id: 'bencao_escudo', lvl: 6, name: 'Bênção: Escudo da Fé', icon: '🛡', desc: '+2 CA sem Concentração (Canalizar Divindade)', cost: 'b', res: 'canalizar', effect: { castFree: 'escudo_fe', noConc: true } },
          { id: 'bencao_arma', lvl: 6, name: 'Bênção: Arma Espiritual', icon: '🗡', desc: 'Arma Espiritual sem Concentração (Canalizar Divindade)', cost: 'b', res: 'canalizar', effect: { castFree: 'arma_espiritual', noConc: true } },
        ] },
    },

    // ======================================================== DRUIDA
    druida: {
      terra: { name: 'Círculo da Terra · Árida', icon: '🏔', srd: true, blurb: 'A terra lembra de tudo — e empresta sua força a quem a protege.',
        features: [
          [3, 'circulo_terra', 'Magias do Círculo (Árida)', 'Sempre preparadas: Nublar, Mãos Flamejantes, Raio de Fogo; Bola de Fogo; Murchar.', { grantSpells: [[3, 'nublar', 'maos_flamejantes', 'raio_fogo'], [5, 'bola_fogo'], [7, 'murchar']] }],
          [3, 'auxilio_terra', 'Auxílio da Terra', 'Gaste uma Forma Selvagem (Ação de Magia): inimigos na área fazem TR de CON ou sofrem 2d6 Necrótico (metade se passarem) e uma criatura recupera 2d6 PV (3d6 no nível 10).'],
          [6, 'recuperacao_natural', 'Recuperação Natural', 'Recupera espaços de magia num Descanso Curto e conjura uma magia do Círculo sem espaço (1×/Descanso Longo).'],
          [10, 'protecao_natureza', 'Proteção da Natureza', 'Imune a Envenenado e Resistência a Fogo (terra árida).', { condImm: ['envenenado'], resist: ['fogo'] }],
        ],
        powers: [{ id: 'auxilio_terra', lvl: 3, name: 'Auxílio da Terra', icon: '🌱', desc: 'Necrótico em todos (TR Con) + cura', cost: 'a', res: 'forma', effect: { aoe: { dice: (h) => `${h.level >= 14 ? 4 : h.level >= 10 ? 3 : 2}d6`, type: 'necrotico', save: 'con', half: true }, heal: (h) => `${h.level >= 14 ? 4 : h.level >= 10 ? 3 : 2}d6` } }] },
      lua: { name: 'Círculo da Lua', icon: '🌙', blurb: 'Vira fera de verdade: garras, couro grosso e fome de luta.',
        features: [
          [3, 'formas_circulo', 'Formas do Círculo', 'Forma Selvagem dá PV temporários = 3 × nível e CA mínima 13 + SAB enquanto durar. Magias sempre preparadas (conjuráveis em forma de fera): Curar Ferimentos, Raio Lunar, Lampejo Estelar; Curar Ferimentos em Massa.', { wildForm: { tempMult: 3, acBase: 13 }, grantSpells: [[3, 'curar_ferimentos', 'raio_lunar', 'lampejo_estelar'], [9, 'curar_massa']] }],
          [6, 'formas_aprimoradas', 'Formas do Círculo Aprimoradas', 'Radiância Lunar: em Forma Selvagem seus ataques podem causar dano Radiante. Resistência Aumentada: some SAB aos TR de Constituição.', { moonRadiant: true, saveAbBonus: { con: 'sab' } }],
          [10, 'passo_lunar', 'Passo Lunar', 'Ação Bônus (SAB vezes/Descanso Longo): teleporte de 9 m e Vantagem no próximo ataque neste turno.'],
        ],
        resources: { lunar: (h) => (h.level >= 10 ? pos(mod(h, 'sab')) : 0) },
        powers: [{ id: 'passo_lunar', lvl: 10, name: 'Passo Lunar', icon: '🌙', desc: 'Vantagem no próximo ataque', cost: 'b', res: 'lunar', effect: { buff: 'advNext', rounds: 1 } }] },
      mar: { name: 'Círculo do Mar', icon: '🌊', blurb: 'A fúria do oceano te envolve como uma maré viva.',
        features: [
          [3, 'ira_mar', 'Ira do Mar', 'Gaste uma Forma Selvagem (Ação Bônus): por 10 minutos, ao ativar e com uma Ação Bônus nos turnos seguintes, uma criatura faz TR de CON ou sofre (SAB)d6 de Frio e é empurrada. Magias sempre preparadas: Raio de Gelo, Onda Trovejante, Despedaçar; Relâmpago; Tempestade de Gelo; Imobilizar Monstro.', { grantSpells: [[3, 'raio_gelo', 'onda_trovejante', 'despedacar'], [5, 'relampago'], [7, 'tempestade_gelo'], [9, 'imobilizar_monstro']] }],
          [6, 'afinidade_aquatica', 'Afinidade Aquática', 'A aura cresce para 3 m e você ganha deslocamento de natação.'],
          [10, 'filho_tempestade', 'Nascido da Tempestade', 'Com a Ira do Mar ativa: deslocamento de voo e Resistência a Frio, Elétrico e Trovejante.', { stormborn: true }],
        ],
        powers: [
          { id: 'ira_mar', lvl: 3, name: 'Ira do Mar', icon: '🌊', desc: 'Ativa a aura (10 min) e lança a primeira onda gelada', cost: 'b', res: 'forma', effect: { buff: 'seaAura', rounds: 100 } },
          { id: 'onda_mar', lvl: 3, name: 'Onda da Ira do Mar', icon: '🌀', desc: '(SAB)d6 Frio num inimigo · TR Con', cost: 'b', needBuff: 'seaAura', effect: { seaPulse: true } },
        ] },
      estrelas: { name: 'Círculo das Estrelas', icon: '✨', blurb: 'Lê o céu como um livro e atira constelações nos inimigos.',
        features: [
          [3, 'mapa_estelar', 'Mapa Estelar', 'Orientação e Raio Guia sempre preparados; conjura Raio Guia sem espaço SAB vezes por Descanso Longo.', { grantSpells: [[3, 'raio_guia']] }],
          [3, 'forma_estrelada', 'Forma Estrelada', 'Gaste uma Forma Selvagem (Ação Bônus): constelação do Arqueiro por 10 minutos — ao ativar e como Ação Bônus: ataque mágico de 1d8 + SAB Radiante (2d8 no nível 10). (Cálice e Dragão: opções de cura em grupo e Concentração.)'],
          [6, 'presagio_cosmico', 'Presságio Cósmico', 'Após cada Descanso Longo, um dado define Bem (some 1d6 a um Teste de d20 seu) ou Mal (subtraia 1d6 de um ataque inimigo) — Reação, SAB vezes por Descanso Longo.', { cosmicOmen: true }],
          [10, 'constelacoes_cintilantes', 'Constelações Cintilantes', 'O Arqueiro passa a causar 2d8.'],
        ],
        resources: { mapa: (h) => pos(mod(h, 'sab')), presagio_cosmico: (h) => (h.level >= 6 ? pos(mod(h, 'sab')) : 0) },
        powers: [
          { id: 'mapa_raio', lvl: 3, name: 'Mapa Estelar: Raio Guia', icon: '🗺', desc: 'Raio Guia sem gastar espaço', cost: 'a', res: 'mapa', effect: { castFree: 'raio_guia' } },
          { id: 'forma_estrelada', lvl: 3, name: 'Forma Estrelada', icon: '🌠', desc: 'Arqueiro estelar por 10 minutos', cost: 'b', res: 'forma', effect: { buff: 'starry', rounds: 100 } },
          { id: 'arqueiro_estelar', lvl: 3, name: 'Flecha Estelar', icon: '🏹', desc: '1d8 + SAB Radiante (ataque mágico)', cost: 'b', needBuff: 'starry', effect: { target: { attack: true, dice: (h) => `${h.level >= 10 ? 2 : 1}d8+${mod(h, 'sab')}`, type: 'radiante' } } },
        ] },
    },

    // ======================================================== FEITICEIRO
    feiticeiro: {
      draconico: { name: 'Feitiçaria Dracônica', icon: '🐲', srd: true, blurb: 'Sangue de dragão: escamas, resistência e chamas mais quentes.',
        features: [
          [3, 'resiliencia_draconica', 'Resiliência Dracônica', 'Sem armadura, CA = 10 + DES + CAR; +1 PV máximo por nível de Feiticeiro. Magias sempre preparadas: Orbe Cromático, Comando; Medo.', { unarmored: 'car', hpPerLevel: 1, grantSpells: [[3, 'orbe_cromatico', 'comando'], [5, 'medo']] }],
          [6, 'afinidade_elemental', 'Afinidade Elemental', 'Escolha um tipo (Elarion: Fogo): Resistência a ele e some CAR a uma rolagem de dano de magia desse tipo.', { resist: ['fogo'], spellDmgMod: { types: ['fogo'], ab: 'car' } }],
        ] },
      aberrante: { name: 'Feitiçaria Aberrante', icon: '🧠', blurb: 'Algo de além das estrelas tocou sua mente — e ela nunca mais foi a mesma.',
        features: [
          [3, 'magias_psionicas', 'Magias Psiônicas', 'Sempre preparadas: Braços de Hadar, Sussurros Dissonantes, Estilhaço Mental; Fome de Hadar; Tentáculos Negros. Fala Telepática.', { grantSpells: [[3, 'bracos_hadar', 'sussurros', 'estilhaco_mental'], [5, 'fome_hadar'], [7, 'tentaculos_negros']] }],
          [6, 'defesas_psiquicas', 'Defesas Psíquicas', 'Resistência a Psíquico e Vantagem em TR para evitar ou encerrar Enfeitiçado ou Amedrontado. (Feitiçaria Psiônica: conjurar com Pontos de Feitiçaria.)', { resist: ['psiquico'], saveAdvVs: ['fear', 'charm'] }],
        ] },
      mecanico: { name: 'Feitiçaria Mecânica', icon: '⚙', blurb: 'A ordem absoluta de Mechanus pulsa em você como um relógio.',
        features: [
          [3, 'restaurar_equilibrio', 'Restaurar o Equilíbrio', 'Reação (CAR vezes/Descanso Longo): anula a Vantagem ou Desvantagem de uma jogada. Magias sempre preparadas: Auxílio, Restauração Menor, Proteção contra o Bem e o Mal.', { cancelEnemyAdv: true, grantSpells: [[3, 'auxilio', 'restauracao_menor', 'protecao_mal_bem']] }],
          [6, 'bastiao_lei', 'Bastião da Lei', 'Ação de Magia: gaste 1 a 5 Pontos de Feitiçaria; uma proteção de tantos d8 absorve dano (Elarion usa até 5 pontos e transforma em PV temporários).'],
        ],
        resources: { equilibrio: (h) => pos(mod(h, 'car')) },
        powers: [{ id: 'bastiao_lei', lvl: 6, name: 'Bastião da Lei', icon: '⚙', desc: 'Até 5 Pontos de Feitiçaria → tantos d8 de proteção', cost: 'a', res: 'feiticaria', use: (h) => Math.min(5, E.C.res(h, 'feiticaria')), effect: { temp: (h, n) => `${n}d8` } }] },
      magia_selvagem: { name: 'Feitiçaria Selvagem', icon: '🌀', blurb: 'Sua magia é um dado que ninguém controla — nem você.',
        features: [
          [3, 'surto_magia', 'Surto de Magia Selvagem', 'Uma vez por turno, depois de conjurar magia de Feiticeiro com espaço, role um d20: com 20, role na tabela de Surto (Elarion usa uma tabela resumida).', { wildMagic: true }],
          [3, 'mare_caos', 'Maré do Caos', 'Vantagem num Teste de d20 (1×/Descanso Longo); depois disso, sua próxima magia com espaço causa um surto e devolve a Maré.'],
          [6, 'dobrar_sorte', 'Dobrar a Sorte', 'Reação + 1 Ponto de Feitiçaria: some ou subtraia 1d4 do Teste de d20 de outra criatura (Elarion: tira 1d4 de um ataque inimigo que te acertaria por pouco).', { bendLuck: true }],
        ],
        resources: { caos: () => 1 },
        powers: [{ id: 'mare_caos', lvl: 3, name: 'Maré do Caos', icon: '🎲', desc: 'Vantagem no próximo Teste de d20', cost: 'free', res: 'caos', effect: { luck: true } }] },
    },

    // ======================================================== GUERREIRO
    guerreiro: {
      campeao: { name: 'Campeão', icon: '🏆', srd: true, blurb: 'Excelência física pura: crítico mais fácil e fôlego inesgotável.',
        features: [
          [3, 'critico_aprimorado', 'Crítico Aprimorado', 'Seus ataques com arma e Golpes Desarmados são Críticos com 19 ou 20.'],
          [3, 'atleta_notavel', 'Atleta Notável', 'Vantagem na Iniciativa e em testes de Atletismo.', { initAdv: true }],
          [7, 'estilo_adicional', 'Estilo de Luta Adicional', 'Escolha um segundo Estilo de Luta.', { styleExtra: true }],
          [10, 'guerreiro_heroico', 'Guerreiro Heroico', 'Em combate, se começar o turno sem Inspiração Heroica, você a ganha.', { heroicEachTurn: true }],
        ] },
      mestre_batalha: { name: 'Mestre de Batalha', icon: '♟', blurb: 'Técnica e tática: cada golpe vem com uma manobra.',
        features: [
          [3, 'superioridade', 'Superioridade em Combate', '4 dados de superioridade (d8; d10 no nível 10), voltam em Descanso Curto. Ao acertar: Derrubar, Ameaçar, Desarmar ou Empurrar (+dado de dano e um efeito). Ao errar: Ataque Preciso (+dado na jogada).', { maneuvers: true }],
          [7, 'conheca_inimigo', 'Conheça seu Inimigo', 'Ação Bônus: descobre imunidades, resistências e vulnerabilidades de uma criatura; +1 dado de superioridade.'],
          [10, 'superioridade_aprimorada', 'Superioridade Aprimorada', 'Seus dados de superioridade viram d10.'],
        ],
        resources: { superioridade: (h) => (h.level >= 15 ? 6 : h.level >= 7 ? 5 : 4) } },
      cavaleiro_arcano: { name: 'Cavaleiro Arcano', icon: '🔷', blurb: 'Espada numa mão, magia arcana na outra.',
        features: [
          [3, 'conjuracao_cavaleiro', 'Conjuração', 'Conjura magias de Mago com Inteligência (um terço de conjurador): Toque Chocante, Raio de Fogo, Escudo Arcano, Mísseis Mágicos e, no nível 7, Raio Ardente e Passo Nebuloso. Vínculo com a Arma.', { caster: { type: 'third', ab: 'int' }, grantSpells: [[3, 'toque_chocante', 'raio_fogo', 'escudo_arcano', 'misseis_magicos'], [7, 'raio_ardente', 'passo_nebuloso']] }],
          [7, 'magia_guerra', 'Magia de Guerra', 'Ao usar a ação Atacar, pode trocar um dos ataques por um truque de Mago.', { warMagic: true }],
          [10, 'golpe_mistico', 'Golpe Místico', 'Quem você acerta com arma tem Desvantagem no próximo TR contra uma magia sua até o fim do seu próximo turno.', { mysticStrike: true }],
        ] },
      psiquico: { name: 'Guerreiro Psíquico', icon: '🔮', blurb: 'Energia psiônica vira lâmina, escudo e empurrão.',
        features: [
          [3, 'poder_psionico', 'Poder Psiônico', 'Dados de Energia Psiônica (4 d6; 6 d8 no nível 5; 8 no 9). Golpe Psiônico: 1×/turno ao acertar, +dado + INT de Energia. Campo Protetor: Reação, reduz o dano em dado + INT.', { psiStrike: true, psiShield: true }],
          [7, 'adepto_telecinetico', 'Adepto Telecinético', 'Impulso Telecinético: o alvo do Golpe Psiônico faz TR de Força ou fica Caído (ou é empurrado). Salto Psiônico (deslocamento).', { psiTopple: true }],
          [10, 'baluarte_mental', 'Mente Protegida', 'Resistência a dano Psíquico; gaste um dado para encerrar Enfeitiçado ou Amedrontado no início do turno.', { resist: ['psiquico'] }],
        ],
        resources: { psionico: (h) => 2 * E.C.pb(h) } },
    },

    // ======================================================== LADINO
    ladino: {
      ladrao: { name: 'Ladrão', icon: '💰', srd: true, blurb: 'Mãos rápidas, pés leves e um bolso cheio de poções.',
        features: [
          [3, 'maos_rapidas', 'Mãos Rápidas', 'Ação Bônus: Prestidigitação ou Usar um Objeto (como uma poção).'],
          [3, 'trabalho_alturas', 'Trabalho em Alturas', 'Deslocamento de escalada e saltos com DES (exploração).'],
          [9, 'furtividade_suprema', 'Furtividade Suprema', 'Nova opção de Golpe Astuto — Ataque Furtivo Sorrateiro (custo 1d6): se você estava escondido, continua escondido depois do ataque.', { supremeSneak: true }],
        ] },
      assassino: { name: 'Assassino', icon: '🗡', blurb: 'O primeiro golpe é o único que importa.',
        features: [
          [3, 'assassinar', 'Assassinar', 'Vantagem na Iniciativa. Na primeira rodada, Vantagem contra quem ainda não agiu; se o seu Ataque Furtivo acertar na primeira rodada, + nível de Ladino de dano.', { initAdv: true, firstRoundAdv: true, assassinate: true }],
          [3, 'ferramentas_assassino', 'Ferramentas do Assassino', 'Kit de disfarce e de venenos.'],
          [9, 'infiltracao', 'Especialista em Infiltração', 'Imitação perfeita de vozes e Mira Firme sem perder deslocamento (exploração).'],
        ] },
      trapaceiro_arcano: { name: 'Trapaceiro Arcano', icon: '🎩', blurb: 'Ilusões e encantamentos a serviço do roubo perfeito.',
        features: [
          [3, 'conjuracao_trapaceiro', 'Conjuração', 'Conjura magias de Mago com Inteligência (um terço de conjurador): Raio de Gelo, Sono, Mísseis Mágicos, Riso Histérico e, no nível 7, Imobilizar Pessoa e Passo Nebuloso. Mão Mágica Ligeira.', { caster: { type: 'third', ab: 'int' }, grantSpells: [[3, 'raio_gelo', 'sono', 'misseis_magicos', 'riso_histerico'], [7, 'imobilizar_pessoa', 'passo_nebuloso']] }],
          [9, 'emboscada_magica', 'Emboscada Mágica', 'Se estiver escondido (Invisível) ao conjurar, o alvo faz o TR com Desvantagem.', { hiddenSpellDis: true }],
        ] },
      lamina_alma: { name: 'Lâmina da Alma', icon: '💫', blurb: 'Lâminas psíquicas que surgem do nada e voltam sozinhas.',
        features: [
          [3, 'laminas_psiquicas', 'Lâminas Psíquicas', 'Depois de atacar, Ação Bônus: segunda lâmina psíquica (1d4 + DES Psíquico; conta para Ataque Furtivo com Vantagem). Dados de Energia Psiônica (4 d6; d8 no 5).'],
          [9, 'laminas_alma', 'Lâminas da Alma · Golpes Teleguiados', 'Ao errar com uma Lâmina Psíquica, some um dado psiônico; ele só é gasto se acertar.', { homing: true }],
        ],
        resources: { psionico: (h) => 2 * E.C.pb(h) },
        powers: [{ id: 'laminas_psiquicas', lvl: 3, name: 'Lâmina Psíquica', icon: '💫', desc: '1d4 + DES Psíquico (depois de atacar)', cost: 'b', req: () => true, effect: { needAttacked: true, target: { attack: 'weapon', dice: (h) => `1d4+${mod(h, 'des')}`, type: 'psiquico', sneak: true } } }] },
    },

    // ======================================================== MAGO
    mago: {
      evocador: { name: 'Evocador', icon: '🔥', srd: true, blurb: 'Fogo, gelo e raios — sempre na medida certa.',
        features: [
          [3, 'truque_potente', 'Truque Potente', 'Quando seu truque de dano errar o ataque, ou o alvo passar no teste de resistência, ele ainda sofre metade do dano, sem outros efeitos.'],
          [6, 'esculpir', 'Esculpir Magias', 'Protege aliados das suas magias de Evocação (só aliados).'],
          [10, 'evocacao_potencializada', 'Evocação Potencializada', 'Some INT a uma rolagem de dano das suas magias de Evocação.', { spellDmgMod: { schools: ['Evocação'], ab: 'int' } }],
        ] },
      abjurador: { name: 'Abjurador', icon: '🛡', blurb: 'Escudos, proteções e banimentos: ninguém toca em você.',
        features: [
          [3, 'protecao_arcana', 'Proteção Arcana', 'Ao conjurar uma Abjuração com espaço (como Armadura Arcana), cria uma proteção de 2 × nível + INT PV que dura até o Descanso Longo e absorve dano antes de você; novas Abjurações a recarregam em 2 × círculo.', { arcaneWard: true }],
          [6, 'protecao_projetada', 'Proteção Projetada', 'Reação: a proteção absorve o dano de um aliado próximo (só aliados).'],
          [10, 'quebra_magias', 'Quebra-Magias', 'Contramágica e Dissipar Magia sempre preparadas (magias fora do combate de Elarion).'],
        ] },
      adivinho: { name: 'Adivinho', icon: '🔭', blurb: 'Você já viu esta luta — e sabe como termina.',
        features: [
          [3, 'presagio', 'Presságio', 'Após cada Descanso Longo, role dois d20 e guarde: cada um pode substituir um Teste de d20 (um ataque inimigo ou um TR seu).', { portent: true }],
          [6, 'adivinhacao_experiente', 'Adivinhação Experiente', 'Ao conjurar Adivinhação de 2º círculo ou mais, recupera um espaço menor (poucas Adivinhações no combate).'],
          [10, 'terceiro_olho', 'O Terceiro Olho', 'Visão no Escuro, ver o Etéreo ou ler idiomas (exploração).'],
        ] },
      ilusionista: { name: 'Ilusionista', icon: '🎭', blurb: 'Nada é o que parece — principalmente você.',
        features: [
          [3, 'ilusoes_aprimoradas', 'Ilusões Aprimoradas', 'Conjura Ilusões sem componente verbal e com alcance maior; conhece Ilusão Menor.'],
          [6, 'criaturas_fantasmagoricas', 'Criaturas Fantasmagóricas', 'Invocar Fada como Ilusão sem gastar espaço (1×/Descanso Longo): o espírito fantasma ataca a cada turno (2d6 + 6 Energia).'],
          [10, 'eu_ilusorio', 'Eu Ilusório', 'Reação quando um ataque te acertaria: ele erra (1×/Descanso Curto).', { illusorySelf: true }],
        ],
        resources: { fantasma: (h) => (h.level >= 6 ? 1 : 0), eu_ilusorio: (h) => (h.level >= 10 ? 1 : 0) },
        powers: [{ id: 'criaturas_fantasmagoricas', lvl: 6, name: 'Fada Fantasmagórica', icon: '👻', desc: 'Espírito ilusório que ataca (2d6 + 6 Energia)', cost: 'a', res: 'fantasma', effect: { phantom: true } }] },
    },

    // ======================================================== MONGE
    monge: {
      mao_aberta: { name: 'Guerreiro da Mão Aberta', icon: '✋', srd: true, blurb: 'Golpes que derrubam, empurram e desequilibram.',
        features: [
          [3, 'mao_aberta', 'Técnica da Mão Aberta', 'Cada acerto da Rajada de Golpes pode Derrubar o alvo (TR de Destreza), empurrá-lo ou impedir Ataques de Oportunidade.'],
          [6, 'integridade_corporal', 'Integridade Corporal', 'Ação Bônus (SAB vezes/Descanso Longo): recupera dado de Artes Marciais + SAB PV.'],
        ],
        resources: { integridade: (h) => (h.level >= 6 ? pos(mod(h, 'sab')) : 0) },
        powers: [{ id: 'integridade_corporal', lvl: 6, name: 'Integridade Corporal', icon: '🧘', desc: 'Cura dado de Artes Marciais + SAB', cost: 'b', res: 'integridade', effect: { heal: (h) => `1d${ma(h)}+${Math.max(0, mod(h, 'sab'))}` } }] },
      misericordia: { name: 'Guerreiro da Misericórdia', icon: '🎭', blurb: 'As mesmas mãos que curam também tiram a vida.',
        features: [
          [3, 'mao_dano', 'Mão do Dano', 'Uma vez por turno, ao acertar um Golpe Desarmado, gaste 1 Foco: + dado de Artes Marciais + SAB Necrótico.', { harmHand: true }],
          [3, 'mao_cura', 'Mão da Cura', 'Ação de Magia (1 Foco): recupera dado de Artes Marciais + SAB PV.'],
          [6, 'toque_medico', 'Toque do Médico', 'A Mão do Dano deixa o alvo Envenenado até o fim do seu próximo turno; a Mão da Cura também encerra Cego, Paralisado, Envenenado ou Atordoado.', { harmPoison: true }],
        ],
        powers: [{ id: 'mao_cura', lvl: 3, name: 'Mão da Cura', icon: '💚', desc: 'Cura dado de Artes Marciais + SAB (1 Foco)', cost: 'a', res: 'foco', effect: { heal: (h) => `1d${ma(h)}+${Math.max(0, mod(h, 'sab'))}`, cleanse: (h) => (h.level >= 6 ? ['cego', 'paralisado', 'envenenado', 'atordoado'] : []) } }] },
      sombra: { name: 'Guerreiro da Sombra', icon: '🌑', blurb: 'Some nas sombras e reaparece atrás do inimigo.',
        features: [
          [3, 'artes_sombrias', 'Artes Sombrias', 'Gaste 1 Foco para conjurar Escuridão (você enxerga dentro dela): fica escondido e ataques contra você têm Desvantagem até seu próximo turno. Visão no Escuro.'],
          [6, 'passo_sombras', 'Passo das Sombras', 'Ação Bônus na penumbra: teleporte de até 18 m e Vantagem no próximo ataque corpo a corpo neste turno.'],
        ],
        powers: [
          { id: 'artes_sombrias', lvl: 3, name: 'Artes Sombrias', icon: '🌑', desc: 'Escondido + ataques contra você com Desvantagem', cost: 'a', res: 'foco', effect: { hide: true, buff: 'blur', rounds: 1 } },
          { id: 'passo_sombras', lvl: 6, name: 'Passo das Sombras', icon: '👣', desc: 'Vantagem no próximo ataque', cost: 'b', effect: { buff: 'advNext', rounds: 1 } },
        ] },
      elementos: { name: 'Guerreiro dos Elementos', icon: '🔥', blurb: 'Fogo, água, terra e ar fluem pelos seus punhos.',
        features: [
          [3, 'sintonia_elemental', 'Sintonia Elemental', 'No início do turno (1 Foco), por 10 minutos: alcance maior e seus Golpes Desarmados podem causar Ácido, Frio, Fogo, Elétrico ou Trovejante (Elarion escolhe o que o alvo não resiste) e empurrar.', { elemAttune: true }],
          [6, 'explosao_elemental', 'Explosão Elemental', 'Ação de Magia (2 Foco): esfera de 6 m — TR de DES ou 3 × dado de Artes Marciais de um tipo elemental (metade se passar).'],
        ],
        powers: [
          { id: 'sintonia_elemental', lvl: 3, name: 'Sintonia Elemental', icon: '🌪', desc: 'Golpes com dano elemental por 10 minutos', cost: 'free', res: 'foco', effect: { buff: 'elem', rounds: 100 } },
          { id: 'explosao_elemental', lvl: 6, name: 'Explosão Elemental', icon: '💥', desc: 'Área: 3 × dado de Artes Marciais · TR Des', cost: 'a', res: 'foco', use: 2, effect: { aoe: { dice: (h) => `3d${ma(h)}`, type: 'elemental', save: 'des', half: true } } },
        ] },
    },

    // ======================================================== PALADINO
    paladino: {
      devocao: { name: 'Juramento de Devoção', icon: '🕊', srd: true, blurb: 'O cavaleiro ideal: honra, pureza e uma arma que brilha.',
        features: [
          [3, 'arma_sagrada', 'Arma Sagrada', 'Canalizar Divindade: soma CAR às jogadas de ataque por 10 minutos. Magias sempre preparadas: Proteção contra o Bem e o Mal, Escudo da Fé; Auxílio.', { grantSpells: [[3, 'protecao_mal_bem', 'escudo_fe'], [5, 'auxilio']] }],
          [7, 'aura_devocao', 'Aura de Devoção', 'Você e aliados na aura são imunes a Enfeitiçado.', { condImm: ['enfeiticado'] }],
        ] },
      gloria: { name: 'Juramento da Glória', icon: '🏅', blurb: 'Herói de lenda: cada golpe divino inspira e protege.',
        features: [
          [3, 'golpe_inspirador', 'Golpe Inspirador', 'Logo após um Golpe Divino, gaste Canalizar Divindade: distribui 2d8 + nível PV temporários. Atleta Incomparável (exploração). Magias sempre preparadas: Raio Guia, Heroísmo; Arma Mágica; Velocidade.', { smiteTemp: true, grantSpells: [[3, 'raio_guia', 'heroismo'], [5, 'arma_magica'], [9, 'velocidade']] }],
          [7, 'aura_prontidao', 'Aura de Prontidão', 'Seu deslocamento aumenta 3 m (Elarion: Vantagem para Fugir).', { fleeAdv: true }],
        ] },
      ancioes: { name: 'Juramento dos Anciões', icon: '🌿', blurb: 'Protetor da luz e da vida verde contra as trevas.',
        features: [
          [3, 'ira_natureza', 'Ira da Natureza', 'Canalizar Divindade (Ação): vinhas espectrais — inimigos próximos fazem TR de Força ou ficam Contidos. Magias sempre preparadas: Golpe Constritor; Passo Nebuloso, Raio Lunar.', { grantSpells: [[3, 'golpe_constritor'], [5, 'passo_nebuloso', 'raio_lunar']] }],
          [7, 'aura_protecao_magia', 'Aura de Proteção', 'Você e aliados na aura têm Resistência a dano Necrótico, Psíquico e Radiante.', { resist: ['necrotico', 'psiquico', 'radiante'] }],
        ],
        powers: [{ id: 'ira_natureza', lvl: 3, name: 'Ira da Natureza', icon: '🌿', desc: 'Inimigos: TR For ou Contido', cost: 'a', res: 'canalizar', effect: { aoeCond: { cond: 'contido', save: 'for' } } }] },
      vinganca: { name: 'Juramento da Vingança', icon: '⚖', blurb: 'Nenhum culpado escapa. Nunca.',
        features: [
          [3, 'voto_inimizade', 'Voto de Inimizade', 'Ao usar a ação Atacar, gaste Canalizar Divindade: Vantagem nos ataques contra um alvo por 1 minuto. Magias sempre preparadas: Perdição, Marca do Caçador; Imobilizar Pessoa, Passo Nebuloso; Velocidade.', { grantSpells: [[3, 'perdicao', 'marca_cacador'], [5, 'imobilizar_pessoa', 'passo_nebuloso'], [9, 'velocidade']] }],
          [7, 'vingador_implacavel', 'Vingador Implacável', 'Ao acertar um Ataque de Oportunidade, o alvo fica com Deslocamento 0 e você se move (deslocamento).'],
        ],
        powers: [{ id: 'voto_inimizade', lvl: 3, name: 'Voto de Inimizade', icon: '⚖', desc: 'Vantagem nos ataques contra o alvo', cost: 'free', res: 'canalizar', effect: { vow: true } }] },
    },

    // ======================================================== PATRULHEIRO
    patrulheiro: {
      cacador: { name: 'Caçador', icon: '🏹', srd: true, blurb: 'Especialista em derrubar presas grandes e hordas.',
        features: [
          [3, 'presa_cacador', 'Presa do Caçador · Matador de Colossos', 'Uma vez por turno, +1d8 de dano contra alvo abaixo do PV máximo. Conhecimento do Caçador: sabe as imunidades e resistências do alvo da Marca.'],
          [7, 'taticas_defensivas', 'Táticas Defensivas · Defesa contra Multiataque', 'Quando uma criatura te acerta, ela tem Desvantagem nos outros ataques contra você neste turno.', { multiDefense: true }],
        ] },
      senhor_feras: { name: 'Senhor das Feras', icon: '🐺', blurb: 'Um companheiro primal luta ao seu lado.',
        features: [
          [3, 'companheiro_primal', 'Companheiro Primal', 'Uma Fera da Terra luta com você. Ação Bônus: ela usa Golpe da Fera (seu bônus de ataque mágico, 1d8 + 2 + SAB Cortante).'],
          [7, 'treinamento_excepcional', 'Treinamento Excepcional', 'Os golpes da fera podem causar dano de Energia; ela pode Desengajar, Esquivar ou Ajudar com a Ação Bônus.', { beastUp: true }],
        ],
        powers: [{ id: 'comandar_fera', lvl: 3, name: 'Comandar a Fera', icon: '🐺', desc: 'Golpe da Fera: 1d8 + 2 + SAB', cost: 'b', effect: { target: { attack: true, dice: (h) => `1d8+${2 + mod(h, 'sab')}`, type: (h) => (E.C.hasFx(h, 'beastUp') ? 'energia' : 'cortante'), anim: 'beast' } } }] },
      andarilho_feerico: { name: 'Andarilho Feérico', icon: '🍃', blurb: 'Meio mortal, meio fada — e totalmente imprevisível.',
        features: [
          [3, 'golpes_terriveis', 'Golpes Terríveis', 'Uma vez por turno, +1d4 Psíquico ao acertar com arma. Glamour Sobrenatural. Magias sempre preparadas: Enfeitiçar Pessoa; Passo Nebuloso.', { hitDmg: { dice: '1d4', type: 'psiquico', once: true }, grantSpells: [[3, 'enfeiticar_pessoa'], [5, 'passo_nebuloso']] }],
          [7, 'distorcao_sedutora', 'Distorção Sedutora', 'Vantagem em TR para evitar ou encerrar Enfeitiçado ou Amedrontado.', { saveAdvVs: ['fear', 'charm'] }],
        ] },
      perseguidor: { name: 'Perseguidor Sombrio', icon: '🌒', blurb: 'Caça no escuro e ataca primeiro.',
        features: [
          [3, 'emboscador_terrivel', 'Emboscador Terrível', '+SAB na Iniciativa. Golpe Terrível: ao acertar com arma, +2d6 Psíquico (1×/turno, SAB vezes/Descanso Longo). Visão Umbral. Medo sempre preparado no nível 9.', { init: 'sab', dreadfulStrike: '2d6', grantSpells: [[9, 'medo']] }],
          [7, 'mente_ferro', 'Mente de Ferro', 'Proficiência em TR de Sabedoria.', { saveProf: ['sab'] }],
        ],
        resources: { golpe_terrivel: (h) => pos(mod(h, 'sab')) } },
    },
  };

  // ---------------------------------------------------------------- poderes das classes (Livro do Jogador 2024)
  H.CLASS_POWERS = {
    barbaro: [
      { id: 'golpe_brutal', lvl: 9, name: 'Golpe Brutal', icon: '💥', desc: 'Com Ataque Descuidado: o próximo ataque abre mão da Vantagem; se acertar, +1d10 e Golpe Contundente', cost: 'free', req: (h) => true, effect: { brutal: true } },
    ],
    clerigo: [
      { id: 'expulsar_mortos', lvl: 2, name: 'Expulsar Mortos-Vivos', icon: '☀', desc: 'Mortos-vivos: TR Sab ou Amedrontados e Incapacitados', cost: 'a', res: 'canalizar', effect: { turnUndead: true } },
      { id: 'intervencao_divina', lvl: 10, name: 'Intervenção Divina', icon: '🙏', desc: 'Conjura qualquer magia de Clérigo até o 5º círculo sem espaço', cost: 'a', res: 'intervencao', effect: { intervention: true } },
    ],
    druida: [
      { id: 'ressurgencia', lvl: 5, name: 'Ressurgência Selvagem', icon: '🌿', desc: 'Sem Forma Selvagem: gaste um espaço de magia para recuperar 1 uso', cost: 'free', req: (h) => E.C.res(h, 'forma') <= 0 && E.C.slotsLeft(h).some((n) => n > 0), reqTxt: 'Precisa estar sem Formas e com um espaço', effect: { resurgence: true } },
    ],
    paladino: [
      { id: 'abjurar_inimigos', lvl: 9, name: 'Abjurar Inimigos', icon: '⚜', desc: 'Até CAR inimigos: TR Sab ou Amedrontados', cost: 'a', res: 'canalizar', effect: { aoeCond: { cond: 'amedrontado', save: 'sab', max: (h) => pos(mod(h, 'car')) } } },
    ],
    patrulheiro: [
      { id: 'incansavel', lvl: 10, name: 'Incansável', icon: '💪', desc: '1d8 + SAB PV temporários', cost: 'a', res: 'incansavel', effect: { temp: (h) => `1d8+${Math.max(1, mod(h, 'sab'))}` } },
    ],
  };
  // características de classe que faltavam (níveis 1–10 do Livro do Jogador 2024)
  const addFeat = (cls, f) => { const list = H.CLASSES[cls].features; if (!list.some((x) => x[1] === f[1])) list.push(f); list.sort((a, b) => a[0] - b[0]); };
  addFeat('barbaro', [3, 'conhecimento_primal', 'Conhecimento Primal', 'Uma perícia extra; em Fúria, alguns testes de perícia podem usar Força.']);
  addFeat('barbaro', [5, 'movimento_rapido', 'Movimento Rápido', 'Deslocamento +3 m sem armadura pesada.']);
  addFeat('barbaro', [7, 'bote_instintivo', 'Bote Instintivo', 'Ao entrar em Fúria, move-se metade do deslocamento.']);
  addFeat('bardo', [2, 'especializacao_bardo', 'Especialização', 'Dobra o BP em duas perícias.']);
  addFeat('bardo', [7, 'contraencanto', 'Contraencanto', 'Reação: após você falhar num teste de resistência contra Enfeitiçado ou Amedrontado, repete o teste com Vantagem.', { countercharm: true }]);
  addFeat('bardo', [9, 'especializacao_bardo2', 'Especialização', 'Mais duas perícias com BP dobrado.']);
  addFeat('bardo', [10, 'segredos_magicos', 'Segredos Mágicos', 'Escolhe magias das listas de Bardo, Clérigo, Druida e Mago.']);
  addFeat('bruxo', [9, 'contatar_patrono', 'Contatar Patrono', 'Contatar Outro Plano sem espaço para falar com o patrono (1×/Descanso Longo).']);
  addFeat('clerigo', [2, 'expulsar_mortos', 'Canalizar Divindade · Expulsar Mortos-Vivos', 'Ação de Magia: mortos-vivos a até 9 m fazem TR de Sabedoria ou ficam Amedrontados e Incapacitados por 1 minuto.']);
  addFeat('clerigo', [5, 'queimar_mortos', 'Queimar Mortos-Vivos', 'Expulsar Mortos-Vivos também causa (SAB)d8 Radiante a quem falhar.']);
  addFeat('clerigo', [10, 'intervencao_divina', 'Intervenção Divina', 'Ação: conjura qualquer magia de Clérigo até o 5º círculo sem espaço nem componentes (1×/Descanso Longo).']);
  addFeat('druida', [2, 'companheiro_selvagem', 'Companheiro Selvagem', 'Gaste uma Forma Selvagem para conjurar Encontrar Familiar sem componentes.']);
  addFeat('druida', [5, 'ressurgencia', 'Ressurgência Selvagem', 'Sem usos de Forma Selvagem, gaste um espaço de magia para recuperar um.']);
  addFeat('druida', [7, 'furia_elemental', 'Fúria Elemental · Conjuração Potente', 'Some SAB ao dano dos seus truques de Druida.', { potentCantrip: 'sab' }]);
  addFeat('guerreiro', [2, 'mente_tatica', 'Mente Tática', 'Ao falhar num teste de atributo, gaste um Retomar o Fôlego para somar 1d10.', { tacticalMind: true }]);
  addFeat('guerreiro', [5, 'mudanca_tatica', 'Mudança Tática', 'Ao Retomar o Fôlego, move-se metade do deslocamento sem Ataques de Oportunidade.']);
  addFeat('guerreiro', [9, 'mestre_tatico', 'Mestre Tático', 'Pode trocar a Maestria da arma por Empurrar, Minar ou Lentidão.']);
  addFeat('ladino', [5, 'golpe_astuto', 'Golpe Astuto', 'Ao causar Ataque Furtivo, troque 1d6 por um efeito: Envenenar (TR Con), Derrubar (TR Des) ou Recuar.', { cunningStrike: true }]);
  addFeat('ladino', [7, 'talento_confiavel', 'Talento Confiável', 'Em testes de perícia com proficiência, trate um d20 de 9 ou menos como 10.', { reliableTalent: true }]);
  addFeat('feiticeiro', [2, 'metamagia', 'Metamagia', 'Modifique magias com Pontos de Feitiçaria: Potencializada (1), Busca (1), Acelerada (2) e, no nível 10, Elevada (2).', { metamagic: true }]);
  addFeat('feiticeiro', [5, 'restauracao_feiticeira', 'Restauração Feiticeira', 'Num Descanso Curto, recupera Pontos de Feitiçaria (metade do nível).']);
  addFeat('feiticeiro', [7, 'feiticaria_encarnada', 'Feitiçaria Encarnada', 'Sem usos de Feitiçaria Inata, ative-a com 2 Pontos de Feitiçaria.']);
  addFeat('mago', [2, 'erudito', 'Erudito', 'Especialização numa perícia de conhecimento.']);
  addFeat('mago', [5, 'memorizar', 'Memorizar Magia', 'Troca uma magia preparada num Descanso Curto.']);
  addFeat('monge', [2, 'metabolismo', 'Metabolismo Sobrenatural', 'Ao rolar Iniciativa, recupera todo o Foco e cura dado de Artes Marciais + nível (1×/Descanso Longo).', { uncannyMetabolism: true }]);
  addFeat('monge', [2, 'movimento_sem_armadura', 'Movimento sem Armadura', 'Deslocamento +3 m (mais com o nível).']);
  addFeat('monge', [4, 'queda_lenta', 'Queda Lenta', 'Reação: reduz o dano de queda.']);
  addFeat('monge', [6, 'golpes_fortalecidos', 'Golpes Fortalecidos', 'Seus Golpes Desarmados podem causar dano de Energia.', { empoweredStrikes: true }]);
  addFeat('monge', [7, 'evasao', 'Evasão', 'Em TR de Destreza para metade do dano, sucesso = nenhum dano.']);
  addFeat('monge', [9, 'movimento_acrobatico', 'Movimento Acrobático', 'Corre por paredes e água (exploração).']);
  addFeat('monge', [10, 'foco_elevado', 'Foco Elevado', 'Rajada de Golpes: 3 golpes; Defesa Paciente dá 2 dados de Artes Marciais de PV temporários.', { heightenedFocus: true }]);
  addFeat('monge', [10, 'autorrestauracao', 'Autorrestauração', 'No fim do turno, encerra Enfeitiçado, Amedrontado ou Envenenado.', { selfRestore: true }]);
  addFeat('paladino', [3, 'canalizar_paladino', 'Canalizar Divindade', 'Dois usos (um volta no Descanso Curto): Sentido Divino e as opções do Juramento.']);
  addFeat('paladino', [5, 'corcel_fiel', 'Corcel Fiel', 'Encontrar Corcel sempre preparado (exploração).']);
  addFeat('paladino', [9, 'abjurar_inimigos', 'Abjurar Inimigos', 'Canalizar Divindade (Ação): até CAR criaturas fazem TR de Sabedoria ou ficam Amedrontadas.']);
  addFeat('paladino', [10, 'aura_coragem', 'Aura de Coragem', 'Você e aliados na aura são imunes a Amedrontado.', { condImm: ['amedrontado'] }]);
  addFeat('patrulheiro', [2, 'explorador_habil', 'Explorador Hábil', 'Especialização numa perícia e dois idiomas.']);
  addFeat('patrulheiro', [6, 'andarilho', 'Andarilho', 'Deslocamento +3 m, escalada e natação.']);
  addFeat('patrulheiro', [9, 'especializacao_patrulheiro', 'Especialização', 'Mais duas perícias com BP dobrado.']);
  addFeat('patrulheiro', [10, 'incansavel', 'Incansável', 'Ação de Magia (SAB vezes/Descanso Longo): 1d8 + SAB PV temporários; descansos reduzem a Exaustão.']);

  // Referências das características alteradas nesta revisão; não certifica os demais resumos.
  H.FEATURE_REFERENCES = {
    truque_potente: 'SRD 5.2.1, p. 82 — Potent Cantrip',
    furia_irracional: 'SRD 5.2.1, p. 30 — Mindless Rage',
    aura_devocao: 'SRD 5.2.1, p. 56 — Aura of Devotion',
    contraencanto: 'SRD 5.2.1, p. 33 — Countercharm',
  };

  // lista ordenada para telas
  H.subclassesOf = (cls) => Object.entries(H.SUBCLASSES[cls] || {}).map(([id, d]) => Object.assign({ id }, d));
})();
