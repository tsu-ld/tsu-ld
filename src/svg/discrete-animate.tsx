import { h, type Markup } from "./jsx-to-string";

export type Step = [seconds: number, value: number];

// jumps between values instead of interpolating, so typing and blinking land on whole steps
export function DiscreteAnimate(props: { attribute: string; steps: Step[]; totalSeconds: number }): Markup {
  const keyTimes = props.steps.map(([seconds]) => (seconds / props.totalSeconds).toFixed(4)).join(";");
  const values = props.steps.map(([, value]) => Math.round(value * 100) / 100).join(";");
  return (
    <animate
      attributeName={props.attribute}
      calcMode="discrete"
      values={values}
      keyTimes={keyTimes}
      dur={`${props.totalSeconds}s`}
      begin="0s"
      repeatCount="indefinite"
    />
  );
}
