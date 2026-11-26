/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { ICommand } from "../../interfaces/i-command.js";
import type { CommandContext } from "../../models/commands/command-context.js";
import { Resources } from "../../resources.js";
import { RegistryEntries } from "../registry-entries.js";

export class CommandRegistry {
  private readonly entries: RegistryEntries<ICommand>;

  public constructor(parent: CommandRegistry | null = null) {
    this.entries = new RegistryEntries<ICommand>(Resources.commandRegistry, t => t.id, parent?.entries ?? null);
  }

  public register(command: ICommand): Disposable {
    return this.entries.add(command);
  }

  public find(id: string): ICommand | null {
    return this.entries.find(id);
  }

  public get(id: string): ICommand {
    return this.entries.get(id);
  }

  public run(id: string, context: CommandContext, args: unknown = null): boolean {
    return this.get(id).run(context, args);
  }

  public ids(): IReadOnlyList<string> {
    return this.entries.all().select(t => t.id).toList();
  }
}
