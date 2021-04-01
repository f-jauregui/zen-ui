import { newSpecPage } from '@stencil/core/testing';

const popperMock = {
  destroy: jest.fn(),
  state: {
    placement: 'bottom',
  },
};
import * as popper from '@popperjs/core';
popper.createPopper = jest.fn(() => popperMock);

import { ZenTooltip } from '../zen-tooltip';
import { ZenPopover } from '../../zen-popover/zen-popover';

describe('zen-tooltip', () => {
  it('should correctly apply correct color to each variant', async () => {
    const page = await newSpecPage({
      components: [ZenTooltip, ZenPopover],
      html: `
        <zen-tooltip variant="dark">Some text</zen-tooltip>
      `,
    });
    const tooltip = page.doc.querySelector('zen-tooltip');
    const popover = tooltip.shadowRoot.querySelector('.popover') as HTMLZenPopoverElement;
    expect(popover.backgroundColor).toEqual('#1e272c');

    tooltip.variant = 'error';
    await page.waitForChanges();
    expect(popover.backgroundColor).toEqual('#c22f3d');

    tooltip.variant = '';
    await page.waitForChanges();
    expect(popover.backgroundColor).toEqual('');
  });

  it('should show tooltip on mouse over', async () => {
    const page = await newSpecPage({
      components: [ZenTooltip, ZenPopover],
      html: `
        <div class="trigger">Trigger</div>
        <zen-tooltip>Some text</zen-tooltip>
      `,
    });

    const target = page.doc.querySelector('.trigger');
    const tooltip = page.doc.querySelector('zen-tooltip');
    const popover = tooltip.shadowRoot.querySelector('.popover') as HTMLZenPopoverElement;

    target.dispatchEvent(new MouseEvent('mouseover'));

    await page.waitForChanges();
    expect(popover.visible).toBeTruthy();
  });

  it('should assign target element to popover', async () => {
    const page = await newSpecPage({
      components: [ZenTooltip, ZenPopover],
      html: `
        <div class="trigger">Trigger</div>
        <zen-tooltip>Some text</zen-tooltip>
      `,
    });

    const target = page.doc.querySelector('.trigger');
    const tooltip = page.doc.querySelector('zen-tooltip');
    const popover = tooltip.shadowRoot.querySelector('.popover') as HTMLZenPopoverElement;

    expect(popover.targetElement).toEqual(target);
  });

  it('should render hyperlink and no header', async () => {
    const page = await newSpecPage({
      components: [ZenTooltip, ZenPopover],
      html: `
        <div class="trigger">Trigger</div>
        <zen-tooltip
          link-title="Learn more about this"
          link="http://www.hyperlink.com">
        Some text</zen-tooltip>
      `,
    });

    const target = page.doc.querySelector('.trigger');
    const tooltip = page.doc.querySelector('zen-tooltip');
    target.dispatchEvent(new MouseEvent('mouseover'));

    await page.waitForChanges();

    const heading = tooltip.shadowRoot.querySelector('.heading');
    const link = tooltip.shadowRoot.querySelector('.link');

    expect(heading).not.toBeTruthy();
    expect(link).toBeTruthy();
  });

  it('should render title and no hyperlink', async () => {
    const page = await newSpecPage({
      components: [ZenTooltip, ZenPopover],
      html: `
        <div class="trigger">Trigger</div>
        <zen-tooltip heading="Title">
        Some text</zen-tooltip>
      `,
    });

    const target = page.doc.querySelector('.trigger');
    const tooltip = page.doc.querySelector('zen-tooltip');
    target.dispatchEvent(new MouseEvent('mouseover'));

    await page.waitForChanges();

    const heading = tooltip.shadowRoot.querySelector('.heading');
    const link = tooltip.shadowRoot.querySelector('.link');

    expect(heading).toBeTruthy();
    expect(link).not.toBeTruthy();
  });
});
