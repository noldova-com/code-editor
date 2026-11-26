/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class EditorFeature<T> {
  public readonly name: string;
  private readonly values: WeakMap<object, T> = new WeakMap<object, T>();

  public constructor(name: string) {
    this.name = name;
  }

  public valueIn(owner: object): T | null {
    return this.values.get(owner) ?? null;
  }

  public provide(owner: object, value: T): void {
    this.values.set(owner, value);
  }

  public withdraw(owner: object): void {
    this.values.delete(owner);
  }
}
