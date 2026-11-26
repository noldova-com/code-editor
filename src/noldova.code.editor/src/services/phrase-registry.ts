/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { IPluralPhrase } from "../interfaces/i-plural-phrase.js";
import { PhraseSet } from "../models/phrase-set.js";
import type { PhraseText } from "../models/phrase-text.js";
import { Registration } from "../models/registration.js";
import { Resources } from "../resources.js";

export class PhraseRegistry {
  private readonly parent: PhraseRegistry | null;
  private readonly sets: PhraseSet[] = [];
  private ownLocale: string | null = null;

  public constructor(parent: PhraseRegistry | null = null) {
    this.parent = parent;
  }

  public get locale(): string {
    return this.ownLocale ?? this.parent?.locale ?? Resources.fallbackLocale;
  }

  public set locale(locale: string) {
    this.ownLocale = locale;
  }

  public add(locale: string, phrases: Readonly<Record<string, PhraseText>>): Disposable {
    const added: PhraseSet = new PhraseSet(locale, new Map<string, PhraseText>(Object.entries(phrases)));
    this.sets.push(added);

    return new Registration(() => this.sets.splice(this.sets.indexOf(added), 1));
  }

  public format(key: string, values: Readonly<Record<string, string | number>> = {}): string {
    const placed: ReadonlyMap<string, string | number> = new Map<string, string | number>(Object.entries(values));
    for (const locale of this.locales()) {
      const text: PhraseText | null = this.find(locale, key);
      if (!Object.isNull(text))
        return PhraseRegistry.place(PhraseRegistry.pick(text, locale, placed), locale, placed);
    }

    return key;
  }

  private locales(): readonly string[] {
    const locale: string = this.locale;

    return [...new Set<string>([locale, new Intl.Locale(locale).language, Resources.fallbackLocale])];
  }

  private find(locale: string, key: string): PhraseText | null {
    for (const set of this.sets.toReversed()) {
      const text: PhraseText | undefined = set.locale === locale ? set.phrases.get(key) : undefined;
      if (!Object.isUndefined(text))
        return text;
    }

    return this.parent?.find(locale, key) ?? null;
  }

  private static pick(text: PhraseText, locale: string, values: ReadonlyMap<string, string | number>): string {
    if (Object.isString(text))
      return text;
    const count: string | number | undefined = values.get(Resources.phraseCount);

    return Object.isNumber(count) ? PhraseRegistry.form(text, new Intl.PluralRules(locale).select(count)) : text.other;
  }

  private static form(text: IPluralPhrase, category: Intl.LDMLPluralRule): string {
    switch (category) {
      case Resources.pluralZero:
        return text.zero ?? text.other;
      case Resources.pluralOne:
        return text.one ?? text.other;
      case Resources.pluralTwo:
        return text.two ?? text.other;
      case Resources.pluralFew:
        return text.few ?? text.other;
      case Resources.pluralMany:
        return text.many ?? text.other;
      default:
        return text.other;
    }
  }

  private static place(text: string, locale: string, values: ReadonlyMap<string, string | number>): string {
    return text.replace(Resources.phrasePlaceholderPattern, (whole: string, name: string) => {
      const value: string | number | undefined = values.get(name);
      if (Object.isUndefined(value))
        return whole;

      return Object.isNumber(value) ? value.toLocaleString(locale) : value;
    });
  }
}
