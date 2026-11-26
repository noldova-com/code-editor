/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@noldova/context.exceptions";

import { Resources } from "../../resources.ts";

export class BackgroundJobFailedException extends Exception {
  public override readonly name: string = Resources.backgroundJobFailedExceptionName;

  public constructor(job: string, reason: string) {
    super(Resources.formatBackgroundJobFailed(job, reason));
  }
}
