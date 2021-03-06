import { Component, Host, h, Element, Prop, Watch, State, Event, EventEmitter, Method } from '@stencil/core';
import { createPopper, Placement, Offsets } from '@popperjs/core';
import { getComposedPath, waitNextFrame, applyPrefix, getElementParents } from '../helpers/helpers';
import { showWithAnimation, hideWithAnimation, showInstantly, hideInstantly } from '../helpers/animations';
import { TriggerEvent, SpacingShorthand, Spacing } from '../helpers/types';

@Component({
  tag: 'zen-popover',
  styleUrl: 'zen-popover.scss',
  shadow: true,
})
export class ZenPopover {
  private popperInstance = null;
  private popup: HTMLElement = null;
  private clickHandler = undefined;
  private showTimer = undefined;
  private hideTimer = undefined;
  private clickHandlerTimer = undefined;
  private showDelay = 0;
  private hideDelay = 0;
  private animate = false;

  @Element() host: HTMLZenPopoverElement;

  @State() actualPosition: Placement;

  /** Show/hide popover */
  @Prop({ mutable: true }) visible = false;

  /** Position */
  @Prop() readonly position: Placement = 'bottom';

  /** Trigger element */
  @Prop({ mutable: true }) targetElement: HTMLElement = null;

  /** Triggering event */
  @Prop() readonly triggerEvent: TriggerEvent = 'click';

  /** Close on click outside */
  @Prop() readonly closeOnClickOut: boolean = true;

  /** Close on target click if opened */
  @Prop() readonly closeOnTargetClick: boolean = true;

  /** Popover offset */
  @Prop() readonly offset: Offsets = { x: 0, y: 8 };

  /** User can click content within popover */
  @Prop({ reflect: true }) readonly interactive: boolean = false;

  /** Show and hide delay. Only affects show on hover! Eg. '100' - both show & hide 100ms. '100 500' - show 100ms, hide 500ms. */
  @Prop() readonly delay: string = '0';

  /** Background color */
  @Prop() readonly backgroundColor: string = '';

  /** Show Arrow */
  @Prop() readonly showArrow: boolean = false;

  /** <Description generated in helper file> */
  @Prop() readonly padding: SpacingShorthand = null;
  /** Skipped */
  @Prop() readonly paddingTop: Spacing = null;
  /** Skipped */
  @Prop() readonly paddingRight: Spacing = null;
  /** Skipped */
  @Prop() readonly paddingBottom: Spacing = null;
  /** Skipped */
  @Prop() readonly paddingLeft: Spacing = null;
  /** Use this to lazy initialize popover just before it's supposed to show. Resolve returned promise, when you're ready to show popover. */
  @Prop() readonly beforeShow: () => Promise<void>;

  /** Zen popover visibility change event */
  @Event() zenVisibleChange: EventEmitter<void>;

  @Watch('visible')
  async visibleChanged(visible: boolean): Promise<void> {
    const show = async (): Promise<void> => {
      if (this.animate) {
        showInstantly(this.popup); // show it so popper can get dimensions
        await this.createPopper();
        hideInstantly(this.popup);
        // If it isn't visible (prev hide anim has complete), force start position.
        // Otherwise continue from current position, to prevent anim jumping.
        showWithAnimation(this.popup);
      } else {
        await this.createPopper();
        showInstantly(this.popup);
      }

      if (this.closeOnClickOut) {
        this.clickHandler = event => this.closeOnClickOutside(event);
        clearTimeout(this.clickHandlerTimer);
        this.clickHandlerTimer = setTimeout(() => {
          document.addEventListener('mousedown', this.clickHandler);
        }, 50);
      }
    };

    const hide = (): void => {
      if (this.animate) {
        hideWithAnimation(this.popup, () => this.destroyPopper());
      } else {
        hideInstantly(this.popup);
        this.destroyPopper();
      }

      // remove event listener for click outside
      clearTimeout(this.clickHandlerTimer);
      if (this.clickHandler) document.removeEventListener('mousedown', this.clickHandler);
    };

    clearTimeout(this.hideTimer);
    clearTimeout(this.showTimer);
    visible ? show() : hide();
    this.animate = true; // After initial `visible` is set, we can animate
  }

  @Watch('delay')
  async delayPropChanged(delay: string): Promise<void> {
    const values = delay.match(/([0-9]+)/g);
    this.showDelay = values ? parseInt(values[0], 10) || 0 : 0;
    this.hideDelay = values ? parseInt(values[1], 10) : 0;
    if (Number.isNaN(this.hideDelay)) {
      this.hideDelay = this.showDelay;
    }
  }

  @Watch('targetElement')
  async targetElementChanged(target: HTMLElement): Promise<void> {
    if (target) {
      this.addTriggerEvents();
      if (this.visible) {
        this.destroyPopper();
        this.createPopper();
      }
    }
    // todo: else removeTriggerEvents
  }

  /** Close an opened dropdown menu */
  @Method()
  async toggle(show?: boolean): Promise<void> {
    if (show === undefined) {
      show = !this.visible;
    }
    if (show === this.visible) return;
    this.visible = show;
  }

  /** Control scroll position when scrollable content */
  @Method()
  async setScrollTop(position: number): Promise<void> {
    this.popup.scrollTop = position;
  }

  /** Returns popup html element (the thing with background and shadow) */
  @Method()
  async getPopup(): Promise<HTMLElement> {
    return this.host.shadowRoot.querySelector('.popup') as HTMLElement;
  }

  addTriggerEvents(): void {
    const show = () => {
      clearTimeout(this.hideTimer);
      clearTimeout(this.showTimer);
      if (!this.showDelay) {
        this.visible = true;
      } else {
        this.showTimer = setTimeout(() => {
          this.visible = true;
        }, this.showDelay);
      }
    };

    const hide = () => {
      clearTimeout(this.hideTimer);
      clearTimeout(this.showTimer);
      const instantHide = this.triggerEvent === 'click';
      if (instantHide) {
        this.visible = false;
        return;
      }

      // If it's interactive, user should have a little time to move
      //  mouse over popover before it closes.
      //  Even if it's not interactive, delay hiding a bit to prevent flickering
      //    when mouseout different elements in the popup:
      const timeToMoveMouseOverPopover = this.interactive ? 120 : 20;
      const delay = Math.max(timeToMoveMouseOverPopover, this.hideDelay);
      this.hideTimer = setTimeout(() => {
        this.visible = false;
      }, delay);
    };

    if (this.triggerEvent === 'click' || this.closeOnTargetClick) {
      this.targetElement.addEventListener('mousedown', async () => {
        if (!this.closeOnTargetClick && this.visible) return;
        if (this.beforeShow) {
          await this.beforeShow();
        }
        this.visible = this.triggerEvent === 'click' ? !this.visible : false;
      });
    }

    if (this.triggerEvent === 'hover') {
      this.targetElement.addEventListener('mouseover', () => show());
      this.targetElement.addEventListener('mouseout', () => hide());
      this.targetElement.addEventListener('touchstart', () => show());
      this.targetElement.addEventListener('touchcancel', () => (this.visible = false));
      // Stop hideTimer when mouse is over tooltip:
      this.popup.addEventListener('mouseover', () => show());
      this.popup.addEventListener('mouseout', () => hide());
    }
  }

  async closeOnClickOutside(event: MouseEvent): Promise<void> {
    if (!this.closeOnClickOut) return;
    const path = getComposedPath(event);
    const clickedInPopup = this.interactive && path.find(n => n === this.popup);
    const clickedInTarget = path.find(n => n === this.targetElement);
    if (clickedInPopup || clickedInTarget) return;

    await waitNextFrame(); // prevent race with click-open
    this.visible = false;
  }

  modifiers(): Record<string, unknown>[] {
    const offset = {
      name: 'offset',
      options: {
        offset: [this.offset.x, this.offset.y],
      },
    };

    const preventOverflow = {
      name: 'preventOverflow',
      options: {
        padding: 32,
      },
    };

    return [offset, preventOverflow];
  }

  getParentsWithTransforms(popperTarget: Element): Element[] {
    const parents = getElementParents(popperTarget);
    return parents.filter(el => window.getComputedStyle(el).transform !== 'none');
  }

  async createPopper(): Promise<void> {
    const popupWrap = this.host.shadowRoot.querySelector('.popup-wrap') as HTMLElement;

    const errorParents = this.getParentsWithTransforms(popupWrap);
    if (errorParents.length) {
      console.warn(
        'zen-ui: No parent of zen-popover should have css prop `transform` set! The following parents have css transform set:',
        errorParents,
      );
    }

    this.popperInstance = createPopper(this.targetElement, popupWrap, {
      placement: this.position,
      modifiers: this.modifiers(),
      strategy: errorParents.length ? 'absolute' : 'fixed',
    });
    await waitNextFrame();
    this.actualPosition = this.popperInstance.state.placement;
    this.zenVisibleChange.emit();
  }

  destroyPopper(): void {
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = null;
      this.zenVisibleChange.emit();
    }
  }

  componentDidLoad(): void {
    if (!this.targetElement) {
      this.targetElement = this.host.previousElementSibling as HTMLElement;
    }
    this.visibleChanged(this.visible);
    this.delayPropChanged(this.delay);
  }

  render(): HTMLElement {
    const ZenSpace = applyPrefix('zen-space', this.host);
    const style = this.backgroundColor ? { 'background-color': this.backgroundColor } : {};
    return (
      <Host>
        <div class="popup-wrap" role="tooltip">
          <div class="popup" style={style} data-position={this.actualPosition} ref={el => (this.popup = el)}>
            <div class="scrollable-content">
              <ZenSpace
                block
                padding={this.padding}
                padding-top={this.paddingTop}
                padding-right={this.paddingRight}
                padding-bottom={this.paddingBottom}
                padding-left={this.paddingLeft}
              >
                <slot />
              </ZenSpace>
            </div>
            {this.showArrow && <div class="arrow" data-popper-arrow></div>}
          </div>
        </div>
      </Host>
    );
  }
}
