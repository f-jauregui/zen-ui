import { newSpecPage } from '@stencil/core/testing';
import * as helpers from '../../helpers/helpers';
import { ZenAnimate } from '../zen-animate';

describe('zen-animate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    const [fakeSlot] = helpers.htmlToElement('<div></div>');
    jest
      .spyOn(helpers, 'getSlotElement')
      .mockClear()
      .mockImplementation(() => (fakeSlot as unknown) as HTMLElement);
    jest
      .spyOn(helpers, 'getDefaultSlotContent')
      .mockClear()
      .mockImplementation(() => [fakeSlot]);
    jest
      .spyOn(helpers, 'waitNextFrame')
      .mockClear()
      .mockImplementation(() => new Promise(resolve => resolve(true)));
  });

  it('should render', async () => {
    const page = await newSpecPage({
      components: [ZenAnimate],
      html: `<zen-animate><h1>Slot</h1></zen-animate>`,
    });
    jest.clearAllTimers();
    expect(page.root).toEqualHtml(`
      <zen-animate>
      <mock:shadow-root>
        <div></div>
      </mock:shadow-root>
      <h1>Slot</h1>
    </zen-animate>
    `);
  });

  it('should show on prop change', async () => {
    const page = await newSpecPage({
      components: [ZenAnimate],
      html: `<zen-animate><h1>Slot</h1></zen-animate>`,
    });
    await page.waitForChanges();
    expect(page.root.shadowRoot.querySelector('slot')).toBeFalsy();
    page.rootInstance.show = true;
    await page.waitForChanges();
    expect(page.root.shadowRoot.querySelector('slot')).toBeTruthy();
  });

  it('should hide after close transition', async () => {
    const page = await newSpecPage({
      components: [ZenAnimate],
      html: `<zen-animate><h1>Slot</h1></zen-animate>`,
    });
    await page.waitForChanges();
    expect(page.root.shadowRoot.querySelector('slot')).toBeFalsy();

    page.rootInstance.show = true;
    await page.waitForChanges();
    expect(page.root.shadowRoot.querySelector('slot')).toBeTruthy();

    page.rootInstance.show = false;
    await page.waitForChanges();
    // After transition end doShow is set to false which hides the slot:
    jest.advanceTimersByTime(1000);
    await page.waitForChanges();
    expect(page.root.shadowRoot.querySelector('slot')).toBeFalsy();
  });

  it('should retry to get slot if it failed first time', async () => {
    jest.spyOn(helpers, 'getDefaultSlotContent').mockImplementation(() => []);
    const page = await newSpecPage({
      components: [ZenAnimate],
      html: `<zen-animate show="true"><h1>Slot</h1></zen-animate>`,
    });
    await page.waitForChanges();
    expect(helpers.getDefaultSlotContent).toHaveBeenCalledTimes(4);
  });
});
