import { newSpecPage, SpecPage } from '@stencil/core/testing';
import * as helpers from '../../helpers/helpers';
import { createMutationObserverMock, MutationObserverMock, simulateMouse } from '../../helpers/jest';
import { ZenTableCell } from '../../zen-table-cell/zen-table-cell';
import { ZenTable } from '../../zen-table/zen-table';
import { cleanupTableStructure } from '../../zen-table/zen-table-helpers';
import { ZenTableRow } from '../zen-table-row';

const originalMutationObserver = global.MutationObserver;

describe('zen-table-row', () => {
  it('should render', async () => {
    const page = await newSpecPage({
      components: [ZenTableRow],
      html: `<zen-table-row>Content</zen-table-row>`,
    });

    expect(page.root.innerHTML).toEqual('Content');
  });
});

describe('zen-table-row inside tree structure', () => {
  let page: SpecPage;
  let table: HTMLZenTableElement;
  let parentRow: HTMLZenTableRowElement;
  let secondDepthParent: HTMLZenTableRowElement;
  let firstCell: HTMLZenTableCellElement;
  let secondDepthCell: HTMLZenTableCellElement;
  let mutationObserverMock: jest.Mock<MutationObserverMock>;
  let cells: NodeListOf<HTMLZenTableCellElement>;

  beforeEach(async () => {
    mutationObserverMock = createMutationObserverMock();
    global.MutationObserver = mutationObserverMock;

    cells = ([] as unknown) as NodeListOf<HTMLZenTableCellElement>;
    jest
      .spyOn(helpers, 'getDefaultSlotContent')
      .mockClear()
      .mockImplementation(() => (cells as unknown) as Element[]);

    page = await newSpecPage({
      components: [ZenTable, ZenTableRow, ZenTableCell],
      html: /*html*/ `
        <zen-table columns="1fr 1fr">
          <zen-table-row>
            <zen-table-cell class="first-cell">Row 1, Cell 1</zen-table-cell>
          </zen-table-row>
          <zen-table-row selectable depth="1">
            <zen-table-cell>Child Row 1, Cell 1 </zen-table-cell>
          </zen-table-row>
            <zen-table-row selectable depth="1">
            <zen-table-cell>Child Row 2, Cell 1 </zen-table-cell>
          </zen-table-row>
          <zen-table-row selectable depth="1" second-level-parent>
            <zen-table-cell>Child Row 3, Cell 1 </zen-table-cell>
          </zen-table-row>
          <zen-table-row selectable depth="2">
            <zen-table-cell>Child Row 4, Cell 1 </zen-table-cell>
          </zen-table-row>
            <zen-table-row selectable depth="2">
            <zen-table-cell class="second-depth-cell">Child Row 5, Cell 1 </zen-table-cell>
          </zen-table-row>
        </zen-table>`,
    });
    table = page.root as HTMLZenTableElement;
    parentRow = table.querySelector('zen-table-row') as HTMLZenTableRowElement;
    secondDepthParent = table.querySelector('[second-level-parent]') as HTMLZenTableRowElement;

    cells = parentRow.querySelectorAll('zen-table-cell');
    parentRow.selectable = true;
    parentRow.$expandable = true;

    firstCell = table.querySelector('.first-cell') as HTMLZenTableCellElement;
    secondDepthCell = table.querySelector('.second-depth-cell') as HTMLZenTableCellElement;
    secondDepthCell.$selectable = true;

    await page.waitForChanges();
  });

  afterEach(() => {
    global.MutationObserver = originalMutationObserver;
  });

  it('should render expendable icon and on click expand full span row', async () => {
    parentRow.selectable = true;
    cleanupTableStructure(table);

    expect(parentRow.$visible).toBe(true);
    expect(secondDepthParent.$visible).toBeFalsy();

    const expandableIcon = firstCell.shadowRoot.querySelector('.expand-icon');
    expect(expandableIcon).toBeTruthy();

    simulateMouse('click', expandableIcon);
    cleanupTableStructure(table);

    expect(parentRow.expanded).toBe(true);
    expect(secondDepthParent.$visible).toBe(true);
  });

  it('should set all descendants to not visible on expand false', async () => {
    parentRow.expanded = true;

    cleanupTableStructure(table);
    expect(parentRow.$visible).toBe(true);
    expect(secondDepthParent.$visible).toBe(true);

    const expandableIcon = firstCell.shadowRoot.querySelector('.expand-icon');

    simulateMouse('click', expandableIcon);

    const descendents = [];
    descendents.concat(page.root.querySelectorAll('zen-table-row[depth="1"]'));
    descendents.concat(page.root.querySelectorAll('zen-table-row[depth="2"]'));

    for (const row of descendents.values()) {
      expect((row as HTMLZenTableRowElement).$visible).not.toBe(true);
    }
  });

  it('should select all row descendents on parent row click and property set', async () => {
    simulateMouse('click', firstCell.shadowRoot.querySelector('.checkbox'));

    const descendents = [];
    descendents.concat(page.root.querySelectorAll('zen-table-row[depth="1"]'));
    descendents.concat(page.root.querySelectorAll('zen-table-row[depth="2"]'));

    for (const row of descendents.values()) {
      expect((row as HTMLZenTableRowElement).selected).toBe(true);
    }

    parentRow.selected = false;

    for (const row of descendents.values()) {
      expect((row as HTMLZenTableRowElement).selected).not.toBe(true);
    }
  });

  it('should select only second depth children when setting second depth parent to selected', async () => {
    // First depth children without the first depth parent row
    const firstDepthChildren = page.root.querySelectorAll(
      'zen-table-row[depth="1"] :not(zen-table-row[depth="1"]:first-child)',
    );
    const secondDepthChildren = page.root.querySelectorAll('zen-table-row[depth="2"]');

    secondDepthParent.selected = true;

    for (const row of Array.from(firstDepthChildren).values()) {
      expect((row as HTMLZenTableRowElement).selected).not.toBe(true);
    }
    for (const row of Array.from(secondDepthChildren).values()) {
      expect((row as HTMLZenTableRowElement).selected).toBe(true);
    }
  });

  it('should set indeterminate state to all parent rows', async () => {
    const checkbox = secondDepthCell.shadowRoot.querySelector('.checkbox') as HTMLZenCheckboxElement;
    checkbox.checked = true;
    const event = new Event('zenChange', { bubbles: true, composed: true });
    checkbox.dispatchEvent(event);
    await page.waitForChanges();
    cleanupTableStructure(table);

    expect(parentRow.$indeterminate).toBe(true);
    expect(secondDepthParent.$indeterminate).toBe(true);
  });

  it('should emit zenSelect event', async () => {
    const zenSelectHandler = jest.fn();
    parentRow.addEventListener('zenSelect', zenSelectHandler);

    parentRow.selected = true;

    expect(zenSelectHandler).toHaveBeenCalled();
  });

  it('should emit zenToggle event', async () => {
    const zenToggleHandler = jest.fn();
    parentRow.addEventListener('zenToggle', zenToggleHandler);

    parentRow.expanded = true;

    expect(zenToggleHandler).toHaveBeenCalled();
  });
});
