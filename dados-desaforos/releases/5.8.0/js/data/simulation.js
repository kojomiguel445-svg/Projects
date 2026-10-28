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
  };
  for (const [id, food] of Object.entries(foods)) Object.freeze(Object.assign(food, { id }));
  E.SIM_DATA = Object.freeze({
    DAY_SECONDS: 240,
    START_HOUR: 8,
    DAYS_IN_MONTH: 28,
    GLIDER_PRICE: 80,
    HUNGER_MAX: 100,
    HUNGER_RATE: Object.freeze({ idle: .008, walking: .045, running: .11, battle: .06 }),
    SEASONS: Object.freeze(['Primavera', 'Verão', 'Outono', 'Inverno']),
    WEEKDAYS: Object.freeze(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']),
    FOODS: Object.freeze(foods),
  });
})();
