import { Component, Host, h, Prop, EventEmitter, Event, State, Element, Method } from '@stencil/core';

/**
 * @slot leadingSlot - Slot placed at the left
 * @slot trailingSlot - Slot placed at the right
 */
@Component({
  tag: 'zen-input',
  styleUrl: 'zen-input.scss',
  shadow: true,
})
export class ZenInput {
  leadingSlotFulfilled: boolean;
  trailingSlotFulfilled: boolean;

  @Element() hostElement: HTMLZenInputElement;

  /**
   * This is required for a WebKit bug which requires us to
   * blur and focus an input to properly focus the input in
   * an item with delegatesFocus.
   *
   * @internal
   */
  @Prop() readonly fireFocusEvents = true;

  @State() hasFocus = false;

  /** Placeholder of the input. */
  @Prop() readonly placeholder: string = null;

  /** Disables input. */
  @Prop() readonly disabled = false;

  /** Shows invalid styles. */
  @Prop() readonly invalid = false;

  /** The value of the input. */
  @Prop({ mutable: true }) value?: string | number | null = '';

  /** Emitted when a keyboard input occurred. */
  @Event() zenInput!: EventEmitter<KeyboardEvent>;

  /** Emitted when the input loses focus. */
  @Event() zenBlur!: EventEmitter<FocusEvent>;

  /** Emitted when the input has focus. */
  @Event() zenFocus!: EventEmitter<FocusEvent>;

  /** Set and unset focus on the input. */
  @Method()
  async toggleFocus(focused?: boolean): Promise<void> {
    if (focused === undefined) {
      focused = !this.hasFocus;
    }
    this.hasFocus = focused;
  }

  componentWillLoad(): void {
    this.leadingSlotFulfilled = !!this.hostElement.querySelector('[slot="leadingSlot"]');
    this.trailingSlotFulfilled = !!this.hostElement.querySelector('[slot="trailingSlot"]');
  }

  private onInput = (ev: Event) => {
    const input = ev.target as HTMLInputElement | null;
    if (input) {
      this.value = input.value || '';
    }
    this.zenInput.emit(ev as KeyboardEvent);
  };

  private onBlur = (ev: FocusEvent) => {
    this.hasFocus = false;

    if (this.fireFocusEvents) {
      this.zenBlur.emit(ev);
    }
  };

  private onFocus = (ev: FocusEvent) => {
    this.hasFocus = true;

    if (this.fireFocusEvents) {
      this.zenFocus.emit(ev);
    }
  };

  private getValue(): string {
    return typeof this.value === 'number' ? this.value.toString() : (this.value || '').toString();
  }

  render(): HTMLElement {
    const value = this.getValue();

    return (
      <Host class={{ 'has-focus': this.hasFocus, invalid: this.invalid, disabled: this.disabled }}>
        <slot name="leadingSlot"></slot>
        <input
          type="text"
          class={{ ml: this.leadingSlotFulfilled, mr: this.trailingSlotFulfilled }}
          placeholder={this.placeholder}
          value={value}
          disabled={this.disabled}
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          onInput={this.onInput}
        />
        <slot name="trailingSlot"></slot>
      </Host>
    );
  }
}
