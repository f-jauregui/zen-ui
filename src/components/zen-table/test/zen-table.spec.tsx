import { mutationObserverMock } from '../../helpers/jest';
const originalMutationObserver = global.MutationObserver;

import { newSpecPage } from '@stencil/core/testing';
import { ZenTable } from '../zen-table';

describe('zen-table', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {
      // nothing
    });
  });

  beforeEach(() => {
    global.MutationObserver = mutationObserverMock();
  });

  afterEach(() => {
    global.MutationObserver = originalMutationObserver;
    console.error.mockClear();
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  it('should render', async () => {
    const page = await newSpecPage({
      components: [ZenTable],
      html: `<zen-table columns="1fr">Content</zen-table>`,
    });

    expect(page.root.innerHTML).toEqual('Content');
  });

  it('should remove mutation observer on disconnect', async () => {
    const page = await newSpecPage({
      components: [ZenTable],
      html: `<zen-table columns="1fr">Content</zen-table>`,
    });

    page.root.remove();
    await page.waitForChanges();
    const [observerInstance] = global.MutationObserver.mock.instances;
    expect(observerInstance.disconnect).toHaveBeenCalledTimes(1);
  });

  it('should throw error if columns not defined', async () => {
    await newSpecPage({
      components: [ZenTable],
      html: `<zen-table>Content</zen-table>`,
    });
    expect(global.console.error).toHaveBeenCalledTimes(1);
  });
});
