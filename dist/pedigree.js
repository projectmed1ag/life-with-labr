const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

export const pedigreeBranch = (role, name, title, parents) => ({
  role, name, title,
  parents: parents.map(parent => ({...parent, parents: parent.parents?.map(name => ({name}))}))
});

export function renderPedigree(branches, subject = '') {
  if(!branches.length) return '';
  const depth = node => 1 + Math.max(0, ...(node.parents || []).map(depth));
  const generations = Math.max(...branches.map(depth));
  const renderNode = (node, index, level=1) => `<li class="lineage-branch${node.parents?.length ? '' : ' lineage-branch--leaf'}">
    <div class="lineage-node"><div class="lineage-name"><h4>${escape(node.name || 'Не указан')}</h4><span class="lineage-role${level>1?' lineage-role--ancestor':''}">${escape(node.role || (index?'Мать':'Отец'))}${level>1?` · ${level}-е поколение`:''}</span></div>${node.title ? `<p>${escape(node.title)}</p>` : ''}</div>
    ${node.parents?.length ? `<ul class="lineage-children${node.parents.length===1?' lineage-children--partial':''}">${node.parents.map((parent,i)=>renderNode(parent,i,level+1)).join('')}</ul>` : ''}
  </li>`;
  // One source of ancestry, two presentations: the wide tree and touch disclosures.
  // Native details keep every generation available without JavaScript.
  const renderFamily = (parents, name) => `<div class="lineage-family">
    ${name ? `<p class="lineage-family-caption"><span>Родители:</span> <strong>${escape(name)}</strong></p>` : ''}
    <ul class="lineage-relatives">${parents.map((node, index) => `<li class="lineage-relative">
      <div class="lineage-relative-heading"><span class="lineage-relative-role">${escape(node.role || (index ? 'Мать' : 'Отец'))}</span><h4>${escape(node.name || 'Не указан')}</h4></div>
      ${node.title ? `<p class="lineage-relative-title">${escape(node.title)}</p>` : ''}
      ${node.parents?.length ? `<details class="lineage-more"><summary><span class="lineage-expand-label">Показать родителей</span><span class="lineage-collapse-label">Скрыть родителей</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>${renderFamily(node.parents, node.name || 'Не указан')}</details>` : ''}
    </li>`).join('')}</ul>
  </div>`;
  return `<div class="lineage-desktop">${generations > 1 ? `<div class="lineage-generations" aria-hidden="true"><span>Родители</span><span>Второе поколение</span>${generations > 2 ? '<span>Третье поколение</span>' : ''}</div>` : ''}<ul class="lineage-tree${generations === 1 ? ' lineage-tree--short' : ''}">${branches.map((node,index)=>renderNode(node,index)).join('')}</ul></div><div class="lineage-mobile">${renderFamily(branches, subject)}</div>`;
}
