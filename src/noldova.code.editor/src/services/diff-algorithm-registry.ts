/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Enumerable, type IReadOnlyList } from "@noldova/context.collections";

import { RegistrationMissingException } from "../exceptions/registration-missing.exception.js";
import type { IDiffAlgorithm } from "../interfaces/i-diff-algorithm.js";
import { Resources } from "../resources.js";
import { RegistryEntries } from "./registry-entries.js";

export class DiffAlgorithmRegistry {
  private readonly entries: RegistryEntries<IDiffAlgorithm>;

  public constructor(parent: DiffAlgorithmRegistry | null = null) {
    this.entries = new RegistryEntries<IDiffAlgorithm>(Resources.diffAlgorithmRegistry, t => t.id, parent?.entries ?? null);
  }

  public register(algorithm: IDiffAlgorithm): Disposable {
    return this.entries.add(algorithm);
  }

  public find(id: string): IDiffAlgorithm | null {
    return this.entries.find(id);
  }

  public get(id: string): IDiffAlgorithm {
    return this.entries.get(id);
  }

  public ids(): IReadOnlyList<string> {
    return Enumerable.from(this.entries.all()).select(t => t.id).toList();
  }

  public current(id: string | null = null): IDiffAlgorithm {
    const named: IDiffAlgorithm | null = Object.isNull(id) ? null : this.entries.find(id);
    const algorithm: IDiffAlgorithm | undefined = named ?? Enumerable.from(this.entries.all()).lastOrDefault();
    if (Object.isUndefined(algorithm))
      throw new RegistrationMissingException(Resources.diffAlgorithmRegistry, id ?? Resources.anyAlgorithm);

    return algorithm;
  }
}
