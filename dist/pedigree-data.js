// Existing published ancestry, shared by the owner editor and public profiles.
const pedigreeBranch = (role, name, title, parents) => ({role, name, title,
  parents: parents.map(parent => ({...parent, parents: parent.parents?.map(name => ({name}))}))
});
export const knownPedigrees = {
  edel: [pedigreeBranch('ОТЕЦ', 'Никсон Лаб Бонапарт', 'Грандчемпион России · Чемпион России, НКП, РКФ', [
      {name: 'Кристофер Строллер Сан', title: 'Интерчемпион · Грандчемпион', parents: ['Rocheby Step Ahead', 'Юффо Лондон Блю Топаз']},
      {name: 'Kelly for Nikson Dvaruva', title: 'Чемпион России · Литва', parents: ['Big Bang Magic Power', 'Rocheby Pastelshades']}
    ]), pedigreeBranch('МАТЬ', 'Время Мечты Вера', 'Чемпион России, РКФ', [
      {name: 'Жерминаль Мисти Шоу Мэйкер', title: 'Интерчемпион · Грандчемпион', parents: ['Rocheby Step Ahead', 'Жерминаль Мисти Чарминг Чанс']},
      {name: 'Флэми Стар Тестаросса', title: 'Чемпион России · Чемпион-производитель', parents: ['Jentleman Jim Down the Hill', 'Флэми Стар Нирвана']}
    ])],
  aria: [pedigreeBranch('ОТЕЦ', 'Rocheby Squadron Leader', 'Чемпион России, РКФ · Англия', [
      {name: 'Silver Suede Over Rocheby', title: 'Чемпион Англии', parents: ['Anti Aspen of Finnwoods', 'Bridgeford Chrystal Clear']},
      {name: 'Rocheby Serenade', title: 'Палевый · Англия', parents: ['Rocheby Old Smokey', 'Rocheby Sensational']}
    ]), pedigreeBranch('МАТЬ', 'Время Мечты Вера', 'Чемпион России, РКФ', [
      {name: 'Жерминаль Мисти Шоу Мэйкер', title: 'Интерчемпион · Грандчемпион', parents: ['Rocheby Step Ahead', 'Жерминаль Мисти Чарминг Чанс']},
      {name: 'Флэми Стар Тестаросса', title: 'Чемпион России · Чемпион-производитель', parents: ['Jentleman Jim Down the Hill', 'Флэми Стар Нирвана']}
    ])],
  enot: [pedigreeBranch('ОТЕЦ', 'Русмайрас Пьер', 'Чемпион России · Юный Чемпион России, НКП, РКФ, Эстонии, Украины, Словении', []), pedigreeBranch('МАТЬ', 'Русмайрас Смайли', 'Чемпион Литвы, Венгрии', [])]
};

// An explicit empty tree suppresses the legacy fallback, so clearing is durable.
export function resolvePedigree(parent) {
  return parent.pedigreeTree ?? (parent.pedigree ? [] : knownPedigrees[parent.id] || []);
}
export function editablePedigree(nodes = [], depth = 1) {
  return [0, 1].map(index => {
    const node = nodes[index] || {};
    return {name: node.name || '', title: node.title || '',
      parents: depth < 3 ? editablePedigree(node.parents, depth + 1) : []};
  });
}
export function visiblePedigree(nodes = []) {
  return nodes.map((node, index) => ({...node, role: index ? 'Мать' : 'Отец',
    parents: visiblePedigree(node.parents || [])
  })).filter(node => node.name || node.title || node.parents.length);
}
