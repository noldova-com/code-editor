/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { IReadOnlyList } from "@noldova/context.collections";

export class Setting<T> {
  public readonly id: string;
  public readonly defaultValue: T;
  public readonly description: string;
  private readonly reader: (value: unknown) => T | null;

  private constructor(id: string, defaultValue: T, description: string, reader: (value: unknown) => T | null) {
    this.id = id;
    this.defaultValue = defaultValue;
    this.description = description;
    this.reader = reader;
  }

  public static boolean(id: string, defaultValue: boolean, description: string): Setting<boolean> {
    return new Setting<boolean>(id, defaultValue, description, t => Object.isBoolean(t) ? t : null);
  }

  public static number(id: string, defaultValue: number, description: string, minimum: number = -Infinity, maximum: number = Infinity): Setting<number> {
    return new Setting<number>(id, defaultValue, description, t => Object.isNumber(t) && Number.isFinite(t) && t >= minimum && t <= maximum ? t : null);
  }

  public static integer(id: string, defaultValue: number, description: string, minimum: number = -Infinity, maximum: number = Infinity): Setting<number> {
    return new Setting<number>(id, defaultValue, description, t => Object.isNumber(t) && Number.isInteger(t) && t >= minimum && t <= maximum ? t : null);
  }

  public static string(id: string, defaultValue: string, description: string): Setting<string> {
    return new Setting<string>(id, defaultValue, description, t => Object.isString(t) ? t : null);
  }

  public static choice<T extends string>(id: string, defaultValue: T, choices: IReadOnlyList<T>, description: string): Setting<T> {
    return new Setting<T>(id, defaultValue, description, t => choices.firstOrDefault(c => c === t) ?? null);
  }

  public read(value: unknown): T | null {
    return this.reader(value);
  }
}
