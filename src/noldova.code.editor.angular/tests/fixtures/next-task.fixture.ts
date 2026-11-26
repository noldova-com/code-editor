/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class NextTask {
  public static waitAsync(): Promise<void> {
    const done: PromiseWithResolvers<void> = Promise.withResolvers<void>();
    setTimeout(() => done.resolve());

    return done.promise;
  }
}
