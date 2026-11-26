/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Enumerable, type IReadOnlyList, type List } from "@noldova/context.collections";

import { Registration } from "../models/registration.js";
import type { Setting } from "../models/setting.js";
import { Resources } from "../resources.js";
import { RegistryEntries } from "./registry-entries.js";
import { Required } from "./required.js";

export class SettingRegistry {
  private readonly parent: SettingRegistry | null;
  private readonly declared: RegistryEntries<Setting<unknown>>;
  private readonly languageDefaults: ReadonlyMap<string, ReadonlyMap<string, unknown>>[] = [];
  private readonly listeners: Set<(ids: IReadOnlyList<string>) => void> = new Set<(ids: IReadOnlyList<string>) => void>();
  private user: ReadonlyMap<string, unknown> = new Map<string, unknown>();
  private userLanguages: ReadonlyMap<string, ReadonlyMap<string, unknown>> = new Map<string, ReadonlyMap<string, unknown>>();

  public constructor(parent: SettingRegistry | null = null) {
    this.parent = parent;
    this.declared = new RegistryEntries<Setting<unknown>>(Resources.settingRegistry, t => t.id, parent?.declared ?? null);
  }

  public declare(setting: Setting<unknown>): Disposable {
    return this.declared.add(setting);
  }

  public find(id: string): Setting<unknown> | null {
    return this.declared.find(id);
  }

  public all(): IReadOnlyList<Setting<unknown>> {
    return this.declared.all();
  }

  public setUserValues(values: Readonly<Record<string, unknown>>): void {
    const before: IReadOnlyList<string> = SettingRegistry.idsIn(this.user, this.userLanguages);
    this.user = SettingRegistry.plain(values);
    this.userLanguages = SettingRegistry.scoped(values);
    this.notify(before.union(SettingRegistry.idsIn(this.user, this.userLanguages)).toList());
  }

  public addLanguageDefaults(values: Readonly<Record<string, unknown>>): Disposable {
    const scoped: ReadonlyMap<string, ReadonlyMap<string, unknown>> = SettingRegistry.scoped(values);
    const ids: IReadOnlyList<string> = SettingRegistry.idsIn(new Map<string, unknown>(), scoped);
    this.languageDefaults.push(scoped);
    this.notify(ids);

    return new Registration(() => {
      this.languageDefaults.splice(this.languageDefaults.indexOf(scoped), 1);
      this.notify(ids);
    });
  }

  public get<T>(setting: Setting<T>, languageId: string | null = null): T {
    for (const value of this.candidates(setting.id, languageId)) {
      const read: T | null = setting.read(value);
      if (!Object.isNull(read))
        return read;
    }

    return setting.defaultValue;
  }

  public onChange(listener: (ids: IReadOnlyList<string>) => void): Disposable {
    this.listeners.add(listener);
    const parent: Disposable | null = this.parent?.onChange(listener) ?? null;

    return new Registration(() => {
      this.listeners.delete(listener);
      parent?.[Symbol.dispose]();
    });
  }

  private candidates(id: string, languageId: string | null): readonly unknown[] {
    const language: readonly unknown[] = Object.isNull(languageId) ? [] : [...this.userLanguageValues(id, languageId), ...this.languageDefaultValues(id, languageId)];

    return [...language, ...this.userValues(id)];
  }

  private userLanguageValues(id: string, languageId: string): readonly unknown[] {
    return [...SettingRegistry.valueIn(this.userLanguages.get(languageId), id), ...this.parent?.userLanguageValues(id, languageId) ?? []];
  }

  private languageDefaultValues(id: string, languageId: string): readonly unknown[] {
    const mine: readonly unknown[] = this.languageDefaults.toReversed().flatMap(t => SettingRegistry.valueIn(t.get(languageId), id));

    return [...mine, ...this.parent?.languageDefaultValues(id, languageId) ?? []];
  }

  private userValues(id: string): readonly unknown[] {
    return [...SettingRegistry.valueIn(this.user, id), ...this.parent?.userValues(id) ?? []];
  }

  private notify(ids: IReadOnlyList<string>): void {
    if (ids.count() === 0)
      return;
    for (const listener of [...this.listeners])
      listener(ids);
  }

  private static valueIn(values: ReadonlyMap<string, unknown> | undefined, id: string): readonly unknown[] {
    return Object.isUndefined(values) || !values.has(id) ? [] : [values.get(id)];
  }

  private static plain(values: Readonly<Record<string, unknown>>): ReadonlyMap<string, unknown> {
    return new Map<string, unknown>(Object.entries(values).filter(t => !Resources.languageScopePattern.test(t[0])));
  }

  private static scoped(values: Readonly<Record<string, unknown>>): ReadonlyMap<string, ReadonlyMap<string, unknown>> {
    const scoped: Map<string, ReadonlyMap<string, unknown>> = new Map<string, ReadonlyMap<string, unknown>>();
    for (const [key, value] of Object.entries(values)) {
      const match: RegExpExecArray | null = Resources.languageScopePattern.exec(key);
      if (!Object.isNull(match) && Object.isPlainObject(value))
        scoped.set(Required.value(match[1]), new Map<string, unknown>(Object.entries(value)));
    }

    return scoped;
  }

  private static idsIn(plain: ReadonlyMap<string, unknown>, scoped: ReadonlyMap<string, ReadonlyMap<string, unknown>>): List<string> {
    return Enumerable.from(plain.keys()).concat(Enumerable.from(scoped.values()).selectMany(t => t.keys())).distinct().toList();
  }
}
