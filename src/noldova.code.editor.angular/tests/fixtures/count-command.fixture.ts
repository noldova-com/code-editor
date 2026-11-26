/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ICommand } from "@noldova/code.editor";

export class CountCommand implements ICommand {
  public readonly id: string = "test.comment";
  public runs: number = 0;

  public run(): boolean {
    this.runs++;

    return true;
  }
}
