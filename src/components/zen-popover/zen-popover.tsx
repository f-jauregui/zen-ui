import { Component, Host, h, Element, Prop, Watch } from '@stencil/core';
import { createPopper, Placement, Offsets } from '@popperjs/core';
import { getSlotElement, getComposedPath, waitNextFrame } from '../helpers/helpers';
import { TriggerEvent } from '../helpers/types';

@Component({
  tag: 'zen-popover',
  styleUrl: 'zen-popover.scss',
  shadow: true,
})
export class ZenPopover {
  private popperInstance = null;
  private targetSlotEl: HTMLElement = null;
  private popup: HTMLElement = null;
  private clickHandler = undefined;
  private hideTimer = undefined;

  @Element() element: HTMLZenPopoverElement;

  /** Show/hide popover */
  @Prop({ mutable: true }) visible = false;

  /** Placement */
  @Prop() readonly position: Placement = 'bottom-end';

  /** Triggering event */
  @Prop() readonly triggerEvent: TriggerEvent = 'click';

  /** Close on click outside */
  @Prop() readonly closeOnClickOut: boolean = true;

  /** Popover offset */
  @Prop() readonly offset: Offsets = { x: 0, y: 8 };

  /** User can click content within popover */
  @Prop({ reflect: true }) readonly interactive: boolean = false;

  @Watch('visible')
  async visibleChanged(visible: boolean): Promise<void> {
    if (this.visible) {
      clearTimeout(this.hideTimer);
    }
    visible ? this.show() : this.hide();
  }

  componentDidLoad(): void {
    this.targetSlotEl = getSlotElement(this.element, 'target');

    // If there is no target element use previous element
    if (!this.targetSlotEl) {
      this.targetSlotEl = this.element.previousElementSibling as HTMLElement;
    }

    // Throw error if there is no target element specified
    if (!this.targetSlotEl) {
      console.error('No target element specified for the target slot!');
      return;
    }

    this.popup = this.element.shadowRoot.querySelector('.panel');

    this.addTriggerEvents();
    this.visibleChanged(this.visible);
  }

  addTriggerEvents(): void {
    const show = () => {
      clearTimeout(this.hideTimer);
      this.visible = true;
    };

    const hide = () => {
      clearTimeout(this.hideTimer);
      if (!this.interactive || this.triggerEvent !== 'hover') {
        this.visible = false;
        return;
      }

      // If it's interactive, user should have a little time to move
      //  mouse over popover before it closes:
      const timeToMoveMouseOverPopover = 120;
      this.hideTimer = setTimeout(() => {
        this.visible = false;
      }, timeToMoveMouseOverPopover);
    };

    // Add events to the target element
    if (this.triggerEvent == 'click') {
      this.targetSlotEl.addEventListener('mousedown', () => (this.visible = !this.visible));
    } else if (this.triggerEvent == 'hover') {
      this.targetSlotEl.addEventListener('mouseover', () => show());
      this.targetSlotEl.addEventListener('mouseout', () => hide());
      this.targetSlotEl.addEventListener('touchstart', () => show());
      this.targetSlotEl.addEventListener('touchcancel', () => (this.visible = false));
      // Stop hideTimer when mouse is over tooltip:
      this.popup.addEventListener('mouseover', () => show());
      this.popup.addEventListener('mouseout', () => hide());
    }
  }

  show(): void {
    // Create popper and set display
    this.createPopper();
    this.popup.style.display = 'block';
    this.visible = true;

    // Add event listener for click outside
    this.clickHandler = event => this.closeOnClickOutside(event);
    setTimeout(() => {
      document.addEventListener('mousedown', this.clickHandler);
    }, 50);
  }

  hide(): void {
    // Destroy popper and set display
    this.destroyPopper();
    this.popup.style.display = 'none';
    this.visible = false;

    // remove event listener for click outside
    if (this.clickHandler) document.removeEventListener('mousedown', this.clickHandler);
  }

  async closeOnClickOutside(event: MouseEvent): Promise<void> {
    const path = getComposedPath(event);
    const clickedInside = this.interactive && path.find(n => n === this.popup);
    if (clickedInside) return;
    await waitNextFrame(); // prevent race with click-open
    this.visible = false;
  }

  createPopper(): void {
    this.popperInstance = createPopper(this.targetSlotEl, this.popup, {
      placement: this.position,
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [this.offset.x, this.offset.y],
          },
        },
      ],
    });
  }

  destroyPopper(): void {
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = null;
    }
  }

  render(): HTMLElement {
    return (
      <Host>
        <slot name="target"></slot>
        <div class="panel">
          <slot />
        </div>
      </Host>
    );
  }
}
