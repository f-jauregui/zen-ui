import { Component, Host, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';
import { isChildOf } from './functions';

export interface OptionItem {
  label: string
}

@Component({
  tag: 'zen-dropdown',
  styleUrl: 'zen-dropdown.scss',
  shadow: true,
})

export class ZenDropdown {

  div: HTMLElement = undefined;
  clickHandler = undefined;

  @State() opened: boolean = false;

  /** Selected option */
  @Prop() val: OptionItem = { label: '' };
  /** Array of available options */
  @Prop() options: Array<OptionItem> = [];
  /** Option key that is unique for each option */
  @Prop() trackBy: string = 'label';
  @Prop() selectedColor: string;
  /** If true, multiple options can be selected */
  @Prop() multiselect: boolean = false;

  @Watch('val')
  dataDidChangeHandler(val) {
    this.emitValueChanged(val);
  }

  /** Emitted on any selection change */
  @Event() input2: EventEmitter<OptionItem>;
  emitValueChanged(value: OptionItem) {
    this.input2.emit(value);
  }

  componentWillLoad() {
    // this.dataDidChangeHandler(this.value);
  }

  selectValue(option) {
    this.val = option;
    this.opened = false;
  }

  toggleDropdown(open) {
    if (open === undefined) open = !this.opened;

    if (open) {
      this.clickHandler = event => this.closeOnClickOut(event);
      document.addEventListener('mousedown', this.clickHandler);
    } else {
      document.removeEventListener('mousedown', this.clickHandler);
    }
    this.opened = open;
  }

  isSelected(option) {
    return option[this.trackBy] === this.val[this.trackBy];
  }

  // Events
  closeOnClickOut(event: any) {
    const clickedInside = this.div.shadowRoot.contains(event.path[0]);
    if (!clickedInside) {
      this.opened = false;
    }
  }

  render() {
    return (
      <Host tabindex="0" class="zen-multiselect" ref={el => this.div = el}>
        <div class={{
            field: true,
            opened: this.opened
          }}
          onClick={() => {this.toggleDropdown(true)}}>
          {this.val.label || 'Select something'}
          <div class="arrow"></div>
        </div>
        {this.opened
          ? <ul class="list">
            { this.options.map((option) =>
              <li
                class={{ selected: this.isSelected(option) }}
                style={{'background-color': this.isSelected(option) ? this.selectedColor : ''}}
                onClick={() => this.selectValue(option)}
              >{option.label}</li>
            )}
          </ul>
          : <ul></ul>
          // : <slot></slot>
        }
        {/* <slot></slot> */}
      </Host>
    );
  }

}
