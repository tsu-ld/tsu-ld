import { ROLES } from "../../profile";
import { DiscreteAnimate, type Step } from "../../svg/discrete-animate";
import { Fragment, h, type Markup } from "../../svg/jsx-to-string";
import {
  CARET_BLINK_HALF_PERIOD_SECONDS,
  DELETING_SECONDS_PER_CHAR,
  HOLD_SECONDS,
  TYPING_SECONDS_PER_CHAR,
} from "../boot-timing";
import { PAD_LEFT, ROLE_CHAR_WIDTH, ROLES_BASELINE } from "../layout";
import type { Palette } from "../palettes";

const CARET_WIDTH = 7;
const CARET_HEIGHT = 14;
const CARET_TOP_OFFSET = 12;
const CARET_GAP = 3;
const CLIP_HEIGHT = 22;
const CLIP_TOP_OFFSET = 16;
const EPSILON = 1e-6;

type RoleSlot = { role: string; startSeconds: number; endSeconds: number };

function slotFor(role: string): number {
  return role.length * (TYPING_SECONDS_PER_CHAR + DELETING_SECONDS_PER_CHAR) + HOLD_SECONDS;
}

function planSlots(): RoleSlot[] {
  let cursor = 0;
  return ROLES.map((role) => {
    const startSeconds = cursor;
    cursor += slotFor(role);
    return { role, startSeconds, endSeconds: cursor };
  });
}

function caretX(charCount: number): number {
  return PAD_LEFT + charCount * ROLE_CHAR_WIDTH + CARET_GAP;
}

function clipWidthSteps(slot: RoleSlot): Step[] {
  const steps: Step[] = [];
  if (slot.startSeconds > 0) steps.push([0, 0]);

  for (let chars = 0; chars <= slot.role.length; chars++) {
    steps.push([slot.startSeconds + chars * TYPING_SECONDS_PER_CHAR, chars * ROLE_CHAR_WIDTH]);
  }

  const holdEnd = typingEndOf(slot) + HOLD_SECONDS;
  for (let chars = slot.role.length - 1; chars >= 0; chars--) {
    steps.push([holdEnd + (slot.role.length - chars) * DELETING_SECONDS_PER_CHAR, chars * ROLE_CHAR_WIDTH]);
  }

  return steps;
}

function typingEndOf(slot: RoleSlot): number {
  return slot.startSeconds + slot.role.length * TYPING_SECONDS_PER_CHAR;
}

function roleOpacitySteps(slot: RoleSlot, totalSeconds: number): Step[] {
  if (slot.startSeconds === 0) return [[0, 1], [slot.endSeconds, 0]];
  if (slot.endSeconds >= totalSeconds) return [[0, 0], [slot.startSeconds, 1]];
  return [[0, 0], [slot.startSeconds, 1], [slot.endSeconds, 0]];
}

function caretPositionSteps(slots: RoleSlot[]): Step[] {
  const steps: Step[] = [];

  for (const slot of slots) {
    for (let chars = 0; chars <= slot.role.length; chars++) {
      steps.push([slot.startSeconds + chars * TYPING_SECONDS_PER_CHAR, caretX(chars)]);
    }

    const holdEnd = typingEndOf(slot) + HOLD_SECONDS;
    for (let chars = slot.role.length - 1; chars >= 1; chars--) {
      // chars=0 is skipped: the next role's first step lands at the same time and spot
      steps.push([holdEnd + (slot.role.length - chars) * DELETING_SECONDS_PER_CHAR, caretX(chars)]);
    }
  }

  return steps;
}

// solid while typing and deleting, blinking only while the finished role is held
function caretBlinkSteps(slots: RoleSlot[]): Step[] {
  const steps: Step[] = [[0, 1]];

  for (const slot of slots) {
    const typingEnd = typingEndOf(slot);
    let isVisible = true;

    for (let elapsed = CARET_BLINK_HALF_PERIOD_SECONDS; elapsed < HOLD_SECONDS - EPSILON; elapsed += CARET_BLINK_HALF_PERIOD_SECONDS) {
      isVisible = !isVisible;
      steps.push([typingEnd + elapsed, isVisible ? 1 : 0]);
    }

    steps.push([typingEnd + HOLD_SECONDS, 1]);
  }

  return steps;
}

export function Typewriter(props: { palette: Palette }): Markup {
  const slots = planSlots();
  const totalSeconds = slots[slots.length - 1]!.endSeconds;

  return (
    <>
      {slots.map((slot, index) => (
        <>
          <clipPath id={`role-${index}`}>
            <rect x={PAD_LEFT} y={ROLES_BASELINE - CLIP_TOP_OFFSET} width="0" height={CLIP_HEIGHT}>
              <DiscreteAnimate attribute="width" steps={clipWidthSteps(slot)} totalSeconds={totalSeconds} />
            </rect>
          </clipPath>
          <text
            x={PAD_LEFT}
            y={ROLES_BASELINE}
            class="role"
            clip-path={`url(#role-${index})`}
            opacity={index === 0 ? 1 : 0}
          >
            {slot.role}
            <DiscreteAnimate attribute="opacity" steps={roleOpacitySteps(slot, totalSeconds)} totalSeconds={totalSeconds} />
          </text>
        </>
      ))}
      <rect
        y={ROLES_BASELINE - CARET_TOP_OFFSET}
        width={CARET_WIDTH}
        height={CARET_HEIGHT}
        fill={props.palette.primary}
        x={caretX(0)}
        opacity="0"
      >
        <DiscreteAnimate attribute="x" steps={caretPositionSteps(slots)} totalSeconds={totalSeconds} />
        <DiscreteAnimate attribute="opacity" steps={caretBlinkSteps(slots)} totalSeconds={totalSeconds} />
      </rect>
    </>
  );
}
