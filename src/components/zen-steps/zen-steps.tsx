import { Component, Host, h, Prop } from '@stencil/core';

export interface StepItem {
  label: string
}

enum StepState {
  Waiting = 'waiting',
  Completed = 'completed',
  Active = 'active',
}

@Component({
  tag: 'zen-steps',
  styleUrl: 'zen-steps.scss',
  shadow: true,
})

export class ZenSteps {
  /** Ordered array of possible steps */
  @Prop({ reflect: true }) steps: Array<StepItem> = [];
  /** Index of currently active step */
  @Prop({ reflect: true }) activeIndex: number = 0;

  getItemState(index):StepState {
    if (index < this.activeIndex) return StepState.Completed;
    if (index === this.activeIndex) return StepState.Active;
    return StepState.Waiting;
  }

  render() {
    return (
      <Host class="zen-steps">
        <ul class={{ steps: true }}>
          { this.steps.map((step, index) =>
            <li
              class={ `step ${this.getItemState(index)}` }
            >
              <div class="roundle">
                { this.getItemState(index) === StepState.Active && <div>{index + 1}</div> }
                { this.getItemState(index) === StepState.Completed && <div>x</div> }
              </div>
              <div class="label">{ step.label }</div>
            </li>
          )}
        </ul>
      </Host>
    );
  }
}
