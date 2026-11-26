/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CommandContext, ICommand } from "@noldova/code.editor";

export class RecordingCommand implements ICommand {
  public readonly id: string;
  public readonly calls: unknown[] = [];
  private readonly result: boolean;

  public constructor(id: string, result: boolean = true) {
    this.id = id;
    this.result = result;
  }

  public run(_context: CommandContext, args: unknown): boolean {
    this.calls.push(args);

    return this.result;
  }
}
