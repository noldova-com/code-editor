/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { StyleColor } from "./style-color.fixture.ts";

export class PageStyle {
  private static readonly ROOT: number = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

  public static rem(pixels: number): number {
    return Math.round(pixels / PageStyle.ROOT * 1000) / 1000;
  }

  public static styleOf(property: StyleColor, variable: string, inside: HTMLElement): string {
    return PageStyle.resolved(property, `var(${variable})`, inside);
  }

  public static paintOf(value: string, inside: HTMLElement): string {
    return PageStyle.resolved(StyleColor.Background, value, inside);
  }

  private static resolved(property: StyleColor, value: string, inside: HTMLElement): string {
    const probe: HTMLSpanElement = document.createElement("span");
    probe.style.setProperty(property, value);
    inside.append(probe);
    const resolved: string = getComputedStyle(probe).getPropertyValue(property);
    probe.remove();

    return resolved;
  }
}
