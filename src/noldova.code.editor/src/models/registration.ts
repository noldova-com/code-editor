/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Registration implements Disposable {
  private readonly remove: () => void;
  private removed: boolean = false;

  public constructor(remove: () => void) {
    this.remove = remove;
  }

  public [Symbol.dispose](): void {
    if (this.removed)
      return;
    this.removed = true;
    this.remove();
  }
}
