/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Required } from "@noldova/code.editor";

import { Resources } from "../../resources.ts";

export class TextMeasure {
  public readonly lineHeight: number;
  public readonly spaceWidth: number;
  public readonly inset: number;
  private readonly context: OffscreenCanvasRenderingContext2D;
  private readonly tabSize: number;

  public constructor(probe: HTMLElement, content: HTMLElement) {
    const style: CSSStyleDeclaration = getComputedStyle(probe);
    this.context = Required.value(new OffscreenCanvas(1, 1).getContext(Resources.canvasContext));
    this.context.font = style.font;
    this.lineHeight = probe.getBoundingClientRect().height;
    this.tabSize = Number.parseInt(style.tabSize, Resources.decimalRadix);
    this.spaceWidth = this.context.measureText(Resources.space).width;
    this.inset = Number.parseFloat(getComputedStyle(content).paddingInlineStart);
  }

  public x(text: string, column: number): number {
    return this.context.measureText(this.expand(text.slice(0, column))).width;
  }

  public columnAt(text: string, x: number): number {
    let low: number = 0;
    let high: number = text.length;
    while (low < high) {
      const middle: number = Math.ceil((low + high) / 2);
      if (this.x(text, middle) <= x)
        low = middle;
      else
        high = middle - 1;
    }
    if (low < text.length && x - this.x(text, low) > this.x(text, low + 1) - x)
      return low + 1;

    return low;
  }

  private expand(text: string): string {
    if (!text.includes(Resources.tab))
      return text;
    let expanded: string = Resources.empty;
    for (const character of text)
      expanded += character === Resources.tab ? Resources.space.repeat(this.tabSize - expanded.length % this.tabSize) : character;

    return expanded;
  }
}
