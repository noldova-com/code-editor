/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ICommand } from "@noldova/code.editor";

export class AnswerCommand implements ICommand {
  public readonly id: string;
  public runs: number = 0;
  private readonly answer: boolean;

  public constructor(id: string, answer: boolean) {
    this.id = id;
    this.answer = answer;
  }

  public run(): boolean {
    this.runs++;

    return this.answer;
  }
}
