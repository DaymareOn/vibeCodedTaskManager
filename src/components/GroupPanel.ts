import { useGroupStore } from '../store/groupStore';
import { DOM } from '../utils/dom';

export const GroupPanel = (): HTMLElement => {
  const panel = DOM.create('div', 'group-panel');

  const render = (): void => {
    DOM.clear(panel);
    const { groups, addGroup, deleteGroup } = useGroupStore.getState();

    const title = DOM.create('h3', 'group-panel-title', '👥 Task Groups');
    DOM.append(panel, title);

    const addRow = DOM.create('div', 'group-add-row');

    const nameInput = DOM.create('input', 'form-input group-name-input') as HTMLInputElement;
    nameInput.type = 'text';
    nameInput.placeholder = 'Group name';

    const kInput = DOM.create('input', 'form-input group-k-input') as HTMLInputElement;
    kInput.type = 'number';
    kInput.min = '0.01';
    kInput.step = '0.1';
    kInput.value = '1.0';
    kInput.placeholder = 'Coefficient k';
    kInput.title = 'Exponential decay coefficient (k). Higher = faster score drop when deadline is far away.';

    const addBtn = DOM.create('button', 'btn btn-secondary', '+ Add Group');
    (addBtn as HTMLButtonElement).type = 'button';
    addBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const k = parseFloat(kInput.value);
      if (name && k > 0) {
        addGroup(name, k);
        nameInput.value = '';
        kInput.value = '1.0';
      }
    });

    DOM.append(addRow, nameInput, kInput, addBtn);
    DOM.append(panel, addRow);

    if (groups.length > 0) {
      const list = DOM.create('ul', 'group-list');
      groups.forEach((group) => {
        const item = DOM.create('li', 'group-item');
        const info = DOM.create('span', 'group-info');
        const nameEl = DOM.create('strong', 'group-name');
        nameEl.textContent = group.name;
        const kEl = DOM.create('span', 'group-k-badge');
        kEl.textContent = `k = ${group.priorityCoefficient}`;
        DOM.append(info, nameEl, kEl);
        const delBtn = DOM.create('button', 'btn btn-danger btn-sm', '×');
        (delBtn as HTMLButtonElement).type = 'button';
        delBtn.title = 'Delete group';
        delBtn.addEventListener('click', () => deleteGroup(group.id));
        DOM.append(item, info, delBtn);
        DOM.append(list, item);
      });
      DOM.append(panel, list);
    }
  };

  useGroupStore.subscribe(render);
  render();

  return panel;
};
