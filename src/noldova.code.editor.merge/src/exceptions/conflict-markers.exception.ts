/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";

export class ConflictMarkersException extends Exception {
  public override readonly name: string = Resources.conflictMarkersExceptionName;

  public readonly line: number;

  public constructor(line: number, reason: string) {
    super(Resources.formatConflictMarkers(line, reason));

    this.line = line;
  }
}
