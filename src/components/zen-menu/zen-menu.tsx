import { Component, Host, h, State, Element, Prop } from '@stencil/core';
import { applyPrefix } from '../helpers/helpers';
import { Placement } from '@popperjs/core';
import { Spacing, SpacingShorthand, TriggerEvent } from '../helpers/types';

@Component({
  tag: 'zen-menu',
  styleUrl: 'zen-menu.scss',
  shadow: true,
})
export class ZenMenu {
  private popover: HTMLZenPopoverElement = null;
  @Element() host: HTMLZenMenuElement;
  @State() target: HTMLElement = null;

  /** Set tooltip position */
  @Prop() readonly position?: Placement = 'bottom-end';

  /** Triggering event */
  @Prop() readonly triggerEvent: TriggerEvent = 'click';

  /** Limit menu height and make content scroll  */
  @Prop() readonly maxHeight: string = 'none';

  /** Set tooltip offset to target element */
  @Prop() readonly offset?: number = 5;

  /** Description generated in helper file */
  @Prop() readonly padding: SpacingShorthand = 'md none';
  /** Skipped */
  @Prop() readonly paddingTop: Spacing = null;
  /** Skipped */
  @Prop() readonly paddingRight: Spacing = null;
  /** Skipped */
  @Prop() readonly paddingBottom: Spacing = null;
  /** Skipped */
  @Prop() readonly paddingLeft: Spacing = null;

  componentDidLoad(): void {
    this.popover.targetElement = this.host.previousElementSibling as HTMLElement;
  }
  render(): HTMLZenMenuElement {
    const ZenPopover = applyPrefix('zen-popover', this.host);

    return (
      <Host>
        <ZenPopover
          class="popover"
          ref={el => (this.popover = el)}
          style={{
            'max-height': this.maxHeight,
          }}
          trigger-event={this.triggerEvent}
          position={this.position}
          offset={{ x: 0, y: this.offset }}
          interactive={true}
          padding={this.padding}
          padding-top={this.paddingTop}
          padding-right={this.paddingRight}
          padding-bottom={this.paddingBottom}
          padding-left={this.paddingLeft}
        >
          <slot></slot>
        </ZenPopover>
      </Host>
    );
  }
}
