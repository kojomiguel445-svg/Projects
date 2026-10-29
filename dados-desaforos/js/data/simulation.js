/* Vida cotidiana: o relógio avança apenas enquanto se joga. Valores em ouro do jogo. */
(() => {
  'use strict';
  const foods = {
    fruta: { name: 'Frutas do pomar', iconKey: 'cherry', hunger: 12, price: 4, desc: 'Uma porção fresca, pronta para comer.' },
    vegetais: { name: 'Legumes da horta', iconKey: 'herb', hunger: 8, price: 3, cookTo: 'legumes_assados', desc: 'Podem ser comidos crus ou assados na fogueira.' },
    pao: { name: 'Pão rústico', iconKey: 'pie', hunger: 20, price: 7, desc: 'Pão de farinha e sementes da vila.' },
    racao: { name: 'Ração de viagem', iconKey: 'backpack', hunger: 28, price: 12, desc: 'Uma refeição conservada para a estrada.' },
    carne_lobo: { name: 'Carne de lobo crua', iconKey: 'meat-stew', raw: true, hunger: 0, price: 5, cookTo: 'lobo_assado', desc: 'Carne de caça. Precisa ser cozida antes de comer.' },
    carne_caca: { name: 'Carne de caça crua', iconKey: 'meat-stew', raw: true, hunger: 0, price: 5, cookTo: 'caca_assada', desc: 'Obtida de animais de caça; prepare na fogueira.' },
    carne_ave: { name: 'Carne de ave crua', iconKey: 'meat-stew', raw: true, hunger: 0, price: 4, cookTo: 'ave_assada', desc: 'Precisa ser assada ou cozida.' },
    peixe_cru: { name: 'Filé de peixe cru', iconKey: 'fish', raw: true, hunger: 0, price: 5, cookTo: 'peixe_assado', desc: 'Um filé limpo, pronto para ir ao fogo.' },
    lobo_assado: { name: 'Assado de lobo', iconKey: 'meat-stew', hunger: 36, price: 13, desc: 'Carne bem passada, preparada na fogueira.' },
    caca_assada: { name: 'Assado de caça', iconKey: 'cooking', hunger: 34, price: 12, desc: 'Refeição quente e substanciosa.' },
    ave_assada: { name: 'Ave assada', iconKey: 'cooking', hunger: 30, price: 11, desc: 'Carne dourada por fora e macia por dentro.' },
    peixe_assado: { name: 'Peixe na brasa', iconKey: 'fish', hunger: 32, price: 12, desc: 'Preparado com um peixe do seu inventário.' },
    legumes_assados: { name: 'Legumes assados', iconKey: 'cooking', hunger: 22, price: 8, desc: 'Legumes da horta assados lentamente.' },
    ensopado_caseiro: { name: 'Ensopado caseiro', iconKey: 'cooking', hunger: 48, price: 20, desc: 'Refeição completa da cozinha da vila.' },
    sopa_peixe: { name: 'Sopa de peixe', iconKey: 'cooking', hunger: 42, price: 16, desc: 'Caldo quente com peixe e legumes, feito no fogão.' },
    guisado_ave: { name: 'Guisado de ave', iconKey: 'cooking', hunger: 44, price: 17, desc: 'Ave cozida devagar com legumes.' },
    torta_frutas: { name: 'Torta de frutas', iconKey: 'pie', hunger: 38, price: 15, desc: 'Massa de pão recheada com frutas do pomar, assada no forno.' },
    pao_tostado: { name: 'Pão tostado com frutas', iconKey: 'pie', hunger: 28, price: 10, desc: 'Pão aquecido na brasa com frutas.' },
    comida_queimada: { name: 'Comida queimada', iconKey: 'flame', hunger: 5, price: 1, desc: 'Passou do ponto no fogo. Dá para comer, mas quase não sacia.' },
  };
  // Pratos preparados no fogão ou na fogueira saem com uma qualidade: ruim, normal, bom ou excelente.
  // A qualidade muda só a saciedade (e o preço de venda); não dá bônus de atributo nem de combate.
  const QUALITY = [null, { tag: 'mal', label: 'Mal preparada', suffix: 'preparo ruim', mult: .7 }, { tag: '', label: 'Normal', mult: 1 }, { tag: 'bem', label: 'Bem preparada', suffix: 'preparo bom', mult: 1.15 }, { tag: 'exc', label: 'Excelente', suffix: 'preparo excelente', mult: 1.3 }];
  const DISHES = ['lobo_assado', 'caca_assada', 'ave_assada', 'peixe_assado', 'legumes_assados', 'ensopado_caseiro', 'sopa_peixe', 'guisado_ave', 'torta_frutas', 'pao_tostado'];
  for (const id of DISHES) {
    const b = foods[id]; b.q = 2; b.base = id;
    for (const q of [1, 3, 4]) foods[`${id}_${QUALITY[q].tag}`] = { name: `${b.name} (${QUALITY[q].suffix})`, iconKey: b.iconKey, hunger: Math.round(b.hunger * QUALITY[q].mult), price: Math.max(1, Math.round(b.price * QUALITY[q].mult)), desc: b.desc, q, base: id };
  }
  // Receitas: ingredientes da mochila (peixe = qualquer peixe; carne = qualquer carne crua), local e tempo de preparo (segundos).
  const RECIPES = [
    { id: 'assado_caca', result: 'caca_assada', need: { carne_caca: 1 }, stations: ['fogueira', 'fogao'], time: 6 },
    { id: 'assado_lobo', result: 'lobo_assado', need: { carne_lobo: 1 }, stations: ['fogueira', 'fogao'], time: 6 },
    { id: 'assado_ave', result: 'ave_assada', need: { carne_ave: 1 }, stations: ['fogueira', 'fogao'], time: 6 },
    { id: 'peixe_brasa', result: 'peixe_assado', need: { peixe: 1 }, stations: ['fogueira', 'fogao'], time: 5 },
    { id: 'legumes_brasa', result: 'legumes_assados', need: { vegetais: 1 }, stations: ['fogueira', 'fogao'], time: 5 },
    { id: 'pao_tostado', result: 'pao_tostado', need: { pao: 1, fruta: 1 }, stations: ['fogueira', 'fogao'], time: 4 },
    { id: 'ensopado', result: 'ensopado_caseiro', need: { carne: 1, vegetais: 2 }, stations: ['fogao'], time: 9 },
    { id: 'sopa_peixe', result: 'sopa_peixe', need: { peixe: 1, vegetais: 1 }, stations: ['fogao'], time: 8 },
    { id: 'guisado_ave', result: 'guisado_ave', need: { carne_ave: 1, vegetais: 1 }, stations: ['fogao'], time: 8 },
    { id: 'torta_frutas', result: 'torta_frutas', need: { pao: 1, fruta: 2 }, stations: ['fogao'], time: 9 },
  ];
  for (const [id, food] of Object.entries(foods)) Object.freeze(Object.assign(food, { id }));
  E.SIM_DATA = Object.freeze({
    DAY_SECONDS: 240,
    START_HOUR: 8,
    DAYS_IN_MONTH: 28,
    GLIDER_PRICE: 80,
    HUNGER_MAX: 100,
    // Saciedade perdida por segundo de jogo ativo. Barra cheia dura ~55 min andando, ~30 min correndo sem parar
    // e ~7 h parado; o ajuste "Ritmo da fome" multiplica esses valores (padrão 1).
    HUNGER_RATE: Object.freeze({ idle: .004, walking: .03, running: .055, battle: .035 }),
    // Multiplicador do tipo físico (mecânica do jogo, não é regra de D&D).
    HUNGER_BUILD: Object.freeze({ gordo: 1.25 }),
    QUALITY: Object.freeze(QUALITY.map((q) => q && Object.freeze(q))),
    RECIPES: Object.freeze(RECIPES.map((r) => Object.freeze(r))),
    SEASONS: Object.freeze(['Primavera', 'Verão', 'Outono', 'Inverno']),
    WEEKDAYS: Object.freeze(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']),
    FOODS: Object.freeze(foods),
  });
})();
