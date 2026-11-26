/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { InvalidOperationException } from "@noldova/context.exceptions";

export class DomWait {
  private static readonly OBSERVED: MutationObserverInit = { subtree: true, childList: true, attributes: true, characterData: true };
  private static readonly BOUND: number = 10000;

  public static async untilAsync(description: string, condition: () => boolean, bound: number = DomWait.BOUND): Promise<void> {
    await DomWait.waitAsync(description, condition, bound, check => {
      const observer: MutationObserver = new MutationObserver(check);
      observer.observe(document.body, DomWait.OBSERVED);

      return () => observer.disconnect();
    });
  }

  public static async untilEventAsync(description: string, target: EventTarget, type: string, condition: () => boolean, bound: number = DomWait.BOUND): Promise<void> {
    await DomWait.waitAsync(description, condition, bound, check => {
      target.addEventListener(type, check);

      return () => target.removeEventListener(type, check);
    });
  }

  private static async waitAsync(description: string, condition: () => boolean, bound: number, watch: (check: () => void) => () => void): Promise<void> {
    if (condition())
      return;
    const done: PromiseWithResolvers<void> = Promise.withResolvers<void>();
    const stop: () => void = watch(() => {
      if (condition())
        done.resolve();
    });
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => done.reject(new InvalidOperationException(`Waited ${bound} ms, but ${description} did not happen.`)), bound);
    try {
      await done.promise;
    } finally {
      stop();
      clearTimeout(timer);
    }
  }
}
