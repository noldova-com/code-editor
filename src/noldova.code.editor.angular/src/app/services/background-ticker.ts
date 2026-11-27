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
  private readonly channel: MessageChannel = new MessageChannel();
  private scheduled: boolean = false;

  public constructor(document: TextDocument, step: (hasTime: () => boolean) => boolean) {
    this.step = step;
    this.channel.port1.onmessage = () => this.tick();
    this.stop = document.onChange(() => this.schedule());
    this.schedule();
  }

  public [Symbol.dispose](): void {
    this.stop();
    this.channel.port1.close();
  }

  private schedule(): void {
    if (this.scheduled)
      return;
    this.scheduled = true;
    this.channel.port2.postMessage(null);
  }

  private tick(): void {
    this.scheduled = false;
    const deadline: number = performance.now() + Resources.backgroundSliceMilliseconds;
    if (this.step(() => performance.now() < deadline))
      this.schedule();
  }
}
