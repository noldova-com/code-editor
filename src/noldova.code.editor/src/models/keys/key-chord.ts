/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { KeySyntaxException } from "../../exceptions/key-syntax.exception.js";
import { Resources } from "../../resources.js";
import { Required } from "../../services/required.js";
import type { KeyPress } from "./key-press.js";

export class KeyChord {
  public readonly text: string;
  private readonly name: string;
  private readonly key: string;
  private readonly shift: boolean;
  private readonly control: boolean;
  private readonly alt: boolean;
  private readonly meta: boolean;

  private constructor(text: string, name: string, modifiers: ReadonlySet<string>) {
    this.text = text;
    this.name = name;
    this.key = name.toLowerCase();
    this.shift = modifiers.has(Resources.modifierShift);
    this.control = modifiers.has(Resources.modifierControl);
    this.alt = modifiers.has(Resources.modifierAlt);
    this.meta = modifiers.has(Resources.modifierMeta);
  }

  public static parse(text: string, primary: string): KeyChord {
    const parts: readonly string[] = text.split(Resources.keyJoiner);
    const key: string = Required.at(parts, parts.length - 1);
    if (String.isNullOrEmpty(key))
      throw new KeySyntaxException(text);
    const modifiers: Set<string> = new Set<string>();
    for (const part of parts.slice(0, -1)) {
      const modifier: string | undefined = Resources.modifierNames.get(part.toLowerCase());
      if (Object.isUndefined(modifier))
        throw new KeySyntaxException(text);
      modifiers.add(modifier === Resources.modifierPrimary ? primary : modifier);
    }

    return new KeyChord(text, Resources.keyAliases.get(key.toLowerCase()) ?? key, modifiers);
  }

  public matches(press: KeyPress): boolean {
    return press.shift === this.shift && press.control === this.control && press.alt === this.alt && press.meta === this.meta && this.keyMatches(press);
  }

  public equals(other: KeyChord): boolean {
    return this.key === other.key && this.shift === other.shift && this.control === other.control && this.alt === other.alt && this.meta === other.meta;
  }

  public label(platform: string): string {
    if (platform === Resources.platformMac)
      return KeyChord.joined([this.control ? Resources.macControlLabel : null, this.alt ? Resources.macAltLabel : null,
        this.shift ? Resources.macShiftLabel : null, this.meta ? Resources.macMetaLabel : null, this.keyLabel()], Resources.macLabelJoiner);
    const meta: string = platform === Resources.platformWindows ? Resources.windowsMetaLabel : Resources.linuxMetaLabel;

    return KeyChord.joined([this.control ? Resources.controlLabel : null, this.shift ? Resources.shiftLabel : null, this.alt ? Resources.altLabel : null,
      this.meta ? meta : null, this.keyLabel()], Resources.keyLabelJoiner);
  }

  private static joined(parts: readonly (string | null)[], joiner: string): string {
    return parts.filter(t => !Object.isNull(t)).join(joiner);
  }

  private keyLabel(): string {
    if (this.name === Resources.space)
      return Resources.spaceLabel;

    return this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }

  private keyMatches(press: KeyPress): boolean {
    const code: string = press.code.toLowerCase();
    if (this.key.length > 1)
      return press.key.toLowerCase() === this.key || code === this.key;
    if (press.key.toLowerCase() === this.key)
      return true;

    return !Resources.layoutKeyPattern.test(press.key) && (code === Resources.letterCodePrefix + this.key || code === Resources.digitCodePrefix + this.key);
  }
}
