/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { TextDocument } from "@noldova/code.editor";

import { Resources } from "../../resources.ts";

export class BackgroundTicker implements Disposable {
  private readonly step: (hasTime: () => boolean) => boolean;
  private readonly stop: () => void;
  private timer: ReturnType<typeof setTimeout> | null = null;

  public constructor(document: TextDocument, step: (hasTime: () => boolean) => boolean) {
    this.step = step;
    this.stop = document.onChange(() => this.schedule());
    this.schedule();
  }

  public [Symbol.dispose](): void {
    this.stop();
    if (!Object.isNull(this.timer))
      clearTimeout(this.timer);
  }

  private schedule(): void {
    if (Object.isNull(this.timer))
      this.timer = setTimeout(() => this.tick());
  }

  private tick(): void {
    this.timer = null;
    const deadline: number = performance.now() + Resources.backgroundSliceMilliseconds;
    if (this.step(() => performance.now() < deadline))
      this.schedule();
  }
}
