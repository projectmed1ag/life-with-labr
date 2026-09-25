const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

export const pedigreeBranch = (role, name, title, parents) => ({
  role, name, title,
  parents: parents.map(parent => ({...parent, parents: parent.parents?.map(name => ({name}))}))
});

export function renderPedigree(branches) {
  if(!branches.length) return '';
  const depth = node => 1 + Math.max(0, ...(node.parents || []).map(depth));
  const generations = Math.max(...branches.map(depth));
  const renderNode = (node, index, level=1) => `<li class="lineage-branch${node.parents?.length ? '' : ' lineage-branch--leaf'}">
    <div class="lineage-node"><div class="lineage-name"><h4>${escape(node.name || 'Не указан')}</h4><span class="lineage-role${level>1?' lineage-role--ancestor':''}">${escape(node.role || (index?'Мать':'Отец'))}${level>1?` · ${level}-е поколение`:''}</span></div>${node.title ? `<p>${escape(node.title)}</p>` : ''}</div>
    ${node.parents?.length ? `<ul class="lineage-children${node.parents.length===1?' lineage-children--partial':''}">${node.parents.map((parent,i)=>renderNode(parent,i,level+1)).join('')}</ul>` : ''}
  </li>`;
  return `${generations > 1 ? `<div class="lineage-generations" aria-hidden="true"><span>Родители</span><span>Второе поколение</span>${generations > 2 ? '<span>Третье поколение</span>' : ''}</div>` : ''}<ul class="lineage-tree${generations === 1 ? ' lineage-tree--short' : ''}">${branches.map((node,index)=>renderNode(node,index)).join('')}</ul>`;
}
