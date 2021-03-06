import { Component, Host, h, Prop, Watch, State, Element, Listen, Method, Event, EventEmitter } from '@stencil/core';
import { getDayNumbers, helpers, getMonthName, parseDate } from './date-helpers';
import getYear from 'date-fns/getYear';
import addMonths from 'date-fns/addMonths';
import addYears from 'date-fns/addYears';
import subMonths from 'date-fns/subMonths';
import subYears from 'date-fns/subYears';
import format from 'date-fns/format';
import setDate from 'date-fns/setDate';
import isValid from 'date-fns/isValid';
import isSameDay from 'date-fns/isSameDay';
import {
  faCalendarAlt,
  faChevronDoubleLeft,
  faChevronLeft,
  faChevronRight,
  faChevronDoubleRight,
} from '@fortawesome/pro-regular-svg-icons';
import { applyPrefix } from '../helpers/helpers';
import { InputSize } from '../helpers/types';

enum Navigate {
  prevMonth,
  prevYear,
  nextMonth,
  nextYear,
}

/**
 * @event click | Clicked
 */

@Component({
  tag: 'zen-date-picker',
  styleUrl: 'zen-date-picker.scss',
  shadow: true,
})
export class ZenDatePicker {
  @Element() host: HTMLZenDatePickerElement;

  daysShort = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  dayNums = [];
  popover: HTMLZenPopoverElement = null;
  input: HTMLZenInputElement = null;
  private beforeDate: Date = null;
  private afterDate: Date = null;

  @State() calendarMonthName = '';
  @State() calendarYear = 1970;
  @State() calendarMonth = helpers.today();

  @State() opened = false;

  /** Selected date */
  @Prop({ mutable: true }) formattedDate: string | null = null;

  /** Placeholder */
  @Prop() readonly placeholder: string = 'Select date';

  /** Date format */
  @Prop({ mutable: true }) format = 'MM/dd/yyyy';

  /** Selected date */
  @Prop({ mutable: true }) value: Date = helpers.today();

  /** Close calendar after picking a date */
  @Prop() readonly closeOnClick: boolean = true;

  /** If user can clear the date */
  @Prop() readonly allowEmpty: boolean = true;

  /** Shows invalid styles */
  @Prop() readonly invalid: boolean = false;

  /** Disables all dates before this one */
  @Prop() readonly disableBeforeDate: string | null = null;

  /** Disables all dates after this one */
  @Prop() readonly disableAfterDate: string | null = null;

  /** Size variant */
  @Prop({ reflect: true }) readonly size: InputSize = 'md';

  /** Date picker change event */
  @Event() zenChange: EventEmitter<void>;

  /**  Date picker focus event */
  @Event() zenFocus: EventEmitter<void>;

  /**  Date picker blur event */
  @Event() zenBlur: EventEmitter<void>;

  @Watch('formattedDate')
  async formattedDateChanged(formatted: string): Promise<void> {
    const parsedDate = parseDate(formatted, this.format);
    if (isSameDay(parsedDate, this.value)) return;

    if (isValid(parsedDate)) {
      this.value = parsedDate;
    } else if (this.allowEmpty) {
      this.value = null;
      return;
    } else {
      this.value = helpers.today();
    }
    this.zenChange.emit();
  }

  @Watch('value')
  async dateChanged(value: Date): Promise<void> {
    this.ensureValidFormatString();
    this.formattedDate = isValid(value) ? format(value, this.format) : '';
    if (this.input) {
      this.input.value = this.formattedDate;
    }
    this.calendarMonth = value;
    if (this.popover && this.popover.visible && this.closeOnClick) {
      this.popover.visible = false;
    }
  }

  @Watch('format')
  async formatChanged(_: string, old: string): Promise<void> {
    this.ensureValidFormatString(old);
    this.dateChanged(this.value);
  }

  @Watch('calendarMonth')
  async monthViewedInCalendarChanged(calendarMonth: Date): Promise<void> {
    if (!isValid(calendarMonth)) {
      this.calendarMonth = helpers.today();
    }
    this.dayNums = getDayNumbers(this.calendarMonth);
    this.calendarMonthName = getMonthName(this.calendarMonth);
    this.calendarYear = getYear(this.calendarMonth);
  }

  @Listen('keydown')
  handleKeyDown(ev: KeyboardEvent): boolean {
    if (ev.key === 'Escape') {
      this.popover.toggle(false);
    }

    if (ev.key === ' ') {
      this.popover.toggle();
      ev.preventDefault();
      return false;
    }
  }

  /** Set value to invalid date and formattedDate to empty string. */
  @Method()
  async clearDate(): Promise<void> {
    this.value = new Date(NaN);
    this.zenChange.emit();
  }

  ensureValidFormatString(fallback = 'MM/dd/yyyy'): void {
    try {
      format(this.value, this.format);
    } catch (err) {
      this.format = fallback;
    }
  }

  onBlur(): void {
    this.popover.toggle(false);
    this.zenBlur.emit();
  }

  onFocus(): void {
    this.popover.toggle(true);
    this.zenFocus.emit();
  }

  navigate(type: Navigate): void {
    switch (type) {
      case Navigate.prevMonth:
        this.calendarMonth = subMonths(this.calendarMonth, 1);
        break;
      case Navigate.nextMonth:
        this.calendarMonth = addMonths(this.calendarMonth, 1);
        break;
      case Navigate.prevYear:
        this.calendarMonth = subYears(this.calendarMonth, 1);
        break;
      case Navigate.nextYear:
        this.calendarMonth = addYears(this.calendarMonth, 1);
        break;
    }
  }

  selectDay(day: number): void {
    if (!day) return;
    this.value = setDate(this.calendarMonth, day);
    this.zenChange.emit();
  }

  isSelected(day: number): boolean {
    if (!day) return false;

    const itemDate = setDate(this.calendarMonth, day);
    const itemDateFormatted = format(itemDate, this.format);
    if (isValid(this.value)) {
      return itemDateFormatted === this.formattedDate;
    } else {
      const todayFormatted = format(helpers.today(), this.format);
      return itemDateFormatted === todayFormatted;
    }
  }

  onInputChange(event: Event): void {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    if (!input.value && this.allowEmpty) {
      this.clearDate();
      return;
    }

    const date = parseDate(input.value, this.format);

    if (isValid(date)) {
      this.value = date;
      this.zenChange.emit();
    } else {
      // revert to old date:
      this.dateChanged(this.value);
    }
  }

  stopEventPropagation(event: Event): void {
    event.stopPropagation();
  }

  onOpenToggle(popup: HTMLZenPopoverElement): void {
    this.opened = popup.visible;
  }

  componentWillRender(): void {
    const disableBeforeDate = new Date(this.disableBeforeDate);
    const disableAfterDate = new Date(this.disableAfterDate);
    disableAfterDate.setHours(23, 59, 59, 999);

    if (`${this.disableBeforeDate}` !== 'null') {
      this.beforeDate = isValid(disableBeforeDate) ? disableBeforeDate : null;
      if (`${this.beforeDate}` !== 'null' && this.value < this.beforeDate) this.value = this.beforeDate;
    }

    if (`${this.disableAfterDate}` !== 'null') {
      this.afterDate = isValid(disableAfterDate) ? disableAfterDate : null;
      if (`${this.afterDate}` !== 'null' && this.value > this.afterDate) this.value = this.afterDate;
    }
  }

  componentWillLoad(): void {
    if (`${this.formattedDate}` !== 'null') {
      this.formattedDateChanged(this.formattedDate);
    }
    this.dateChanged(this.value); // set today date
  }

  componentDidLoad(): void {
    if (`${this.formattedDate}` !== 'null') {
      this.formattedDateChanged(this.formattedDate);
    }
    this.dateChanged(this.value); // set today date
  }

  render(): HTMLElement {
    const ZenInput = applyPrefix('zen-input', this.host);
    const ZenText = applyPrefix('zen-text', this.host);
    const ZenSpace = applyPrefix('zen-space', this.host);
    const ZenIcon = applyPrefix('zen-icon', this.host);
    const ZenPopover = applyPrefix('zen-popover', this.host);
    const iconSize = this.size === 'sm' ? 'sm' : 'md';

    return (
      <Host onFocus={() => this.onFocus()} onBlur={() => this.onBlur()}>
        <ZenInput
          id="date-input"
          ref={el => (this.input = el)}
          placeholder={this.placeholder}
          value={this.formattedDate}
          has-focus={this.opened}
          clear-button={this.allowEmpty ? 'true' : 'false'}
          onZenChange={e => this.onInputChange(e)}
          onZenFocus={this.stopEventPropagation}
          onZenBlur={this.stopEventPropagation}
          size={this.size}
        >
          <ZenIcon
            slot="leadingSlot"
            size={iconSize}
            padding="md none md md"
            class="icon"
            icon={faCalendarAlt}
          ></ZenIcon>
        </ZenInput>
        <ZenPopover
          class="calendar"
          tabindex={this.opened ? 0 : -1}
          ref={el => (this.popover = el)}
          interactive
          position="bottom-start"
          close-on-target-click="false"
          onZenVisibleChange={e => this.onOpenToggle(e.target as HTMLZenPopoverElement)}
        >
          <ZenSpace class="navigation" spacing="sm" padding="sm lg" horizontal-align="center" vertical-align="stretch">
            <ZenIcon
              class="icon"
              icon={faChevronDoubleLeft}
              size="sm"
              onClick={() => this.navigate(Navigate.prevYear)}
            ></ZenIcon>
            <ZenIcon
              icon={faChevronLeft}
              size="sm"
              padding="sm"
              class="icon fill"
              onClick={() => this.navigate(Navigate.prevMonth)}
            ></ZenIcon>
            <ZenText align="center" class="date" uppercase bold>
              {this.calendarMonthName} {this.calendarYear}
            </ZenText>
            <ZenIcon
              icon={faChevronRight}
              size="sm"
              padding="sm"
              class="icon fill"
              onClick={() => this.navigate(Navigate.nextMonth)}
            ></ZenIcon>
            <ZenIcon
              class="icon"
              icon={faChevronDoubleRight}
              size="sm"
              padding="sm"
              onClick={() => this.navigate(Navigate.nextYear)}
            ></ZenIcon>
          </ZenSpace>
          <div class="days">
            <ZenSpace padding="lg" horizontal-align="space-around" spacing="sm">
              {this.daysShort.map(dayName => (
                <ZenText class="day-name">{dayName}</ZenText>
              ))}
            </ZenSpace>
          </div>
          <ZenSpace padding="xs lg lg">
            {this.dayNums.map(num => {
              const currentDate = setDate(this.calendarMonth, num);
              return (this.beforeDate && currentDate < this.beforeDate) ||
                (this.afterDate && currentDate > this.afterDate) ? (
                <ZenText
                  class={{
                    'day-num': true,
                    empty: !num,
                  }}
                  disabled
                  align="center"
                >
                  {num || ''}
                </ZenText>
              ) : (
                <ZenText
                  class={{
                    'day-num': true,
                    empty: !num,
                    selected: this.isSelected(num),
                  }}
                  align="center"
                  onClick={() => {
                    this.selectDay(num);
                  }}
                >
                  {num || ''}
                </ZenText>
              );
            })}
          </ZenSpace>
        </ZenPopover>
      </Host>
    );
  }
}
