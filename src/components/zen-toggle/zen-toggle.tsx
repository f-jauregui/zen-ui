import { Component, Host, h, Element, Prop, Watch, State, Event, EventEmitter } from '@stencil/core';

/**
 * @event click | Element clicked
 */

@Component({
  tag: 'zen-toggle',
  styleUrl: 'zen-toggle.scss',
  shadow: true,
})
export class ZenToggle {
  @Element() host: HTMLZenToggleElement;

  /** Sets if component can be tabbable/focusable. */
  @State() tabindex = 0;

  /** Name of element, can be used as reference for form data */
  @Prop() readonly name: string = '';

  /** Set disabled state. */
  @Prop({ reflect: true }) readonly disabled: boolean = false;

  /** Set checked state. */
  @Prop({ mutable: true }) checked = false;

  /** Toggle change event */
  @Event() zenChange: EventEmitter<void>;

  @Watch('checked')
  checkedChanged(): void {
    this.zenChange.emit();
  }

  @Watch('disabled')
  async disabledChanged(disabled: boolean): Promise<void> {
    this.tabindex = disabled ? -1 : 0;
  }

  private onClick = (ev: MouseEvent) => {
    ev.preventDefault();
    if (this.disabled) return;
    this.checked = !this.checked;
  };

  private onKeyDown = (ev: KeyboardEvent) => {
    if (this.disabled) return;
    const toggleKeys = ['Space', 'Enter'];
    if (toggleKeys.includes(ev.code)) {
      ev.preventDefault();
      this.checked = !this.checked;
    }
  };

  componentWillLoad(): void {
    this.disabledChanged(this.disabled);
  }

  render(): HTMLElement {
    return (
      <Host onClick={this.onClick} onKeyDown={this.onKeyDown}>
        <span class={{ switch: true, checked: this.checked }} tabindex={this.tabindex}>
          <span class={{ slider: true, checked: this.checked }}></span>
        </span>
      </Host>
    );
  }
}
