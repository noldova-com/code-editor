/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class LineDiffInput {
  public readonly original: readonly string[];
  public readonly modified: readonly string[];

  public constructor(original: readonly string[], modified: readonly string[]) {
    this.original = original;
    this.modified = modified;
  }
}
