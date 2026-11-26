/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { List } from "@noldova/context.collections";

import { RegistrationExistsException } from "../exceptions/registration-exists.exception.js";
import { RegistrationMissingException } from "../exceptions/registration-missing.exception.js";
import { Registration } from "../models/registration.js";

export class RegistryEntries<T extends {}> {
  private readonly registry: string;
  private readonly idOf: (item: T) => string;
  private readonly parent: RegistryEntries<T> | null;
  private readonly items: Map<string, T> = new Map<string, T>();

  public constructor(registry: string, idOf: (item: T) => string, parent: RegistryEntries<T> | null) {
    this.registry = registry;
    this.idOf = idOf;
    this.parent = parent;
  }

  public add(item: T): Disposable {
    const id: string = this.idOf(item);
    if (this.items.has(id))
      throw new RegistrationExistsException(this.registry, id);
    this.items.set(id, item);

    return new Registration(() => this.items.delete(id));
  }

  public find(id: string): T | null {
    return this.items.get(id) ?? this.parent?.find(id) ?? null;
  }

  public get(id: string): T {
    const item: T | null = this.find(id);
    if (Object.isNull(item))
      throw new RegistrationMissingException(this.registry, id);

    return item;
  }

  public all(): List<T> {
    const all: List<T> = new List<T>(this.parent?.all().where(t => !this.items.has(this.idOf(t))) ?? []);
    all.addRange(this.items.values());

    return all;
  }
}
