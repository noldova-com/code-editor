/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ConflictMarkersException, MergeDocument } from "@noldova/code.editor.merge";

export class MergeOpening {
  public readonly merge: MergeDocument | null;
  public readonly failure: ConflictMarkersException | null;

  public constructor(merge: MergeDocument | null, failure: ConflictMarkersException | null) {
    this.merge = merge;
    this.failure = failure;
  }
}
