/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Enumerable, type IReadOnlyList } from "@noldova/context.collections";

import type { IBackgroundJob } from "../../interfaces/background/i-background-job.js";
import { Resources } from "../../resources.js";
import { RegistryEntries } from "../registry-entries.js";

export class BackgroundJobRegistry {
  private readonly entries: RegistryEntries<IBackgroundJob<unknown, unknown>>;

  public constructor(parent: BackgroundJobRegistry | null = null) {
    this.entries = new RegistryEntries<IBackgroundJob<unknown, unknown>>(Resources.backgroundJobRegistry, t => t.name, parent?.entries ?? null);
  }

  public register<TInput, TOutput>(job: IBackgroundJob<TInput, TOutput>): Disposable {
    return this.entries.add(job);
  }

  public find(name: string): IBackgroundJob<unknown, unknown> | null {
    return this.entries.find(name);
  }

  public get(name: string): IBackgroundJob<unknown, unknown> {
    return this.entries.get(name);
  }

  public names(): IReadOnlyList<string> {
    return Enumerable.from(this.entries.all()).select(t => t.name).toList();
  }
}
