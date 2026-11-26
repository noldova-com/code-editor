/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type IReadOnlyList, List } from "@noldova/context.collections";
import { ArgumentException } from "@noldova/context.exceptions";

import { Resources } from "../../resources.js";
import { KeyChord } from "./key-chord.js";

export class KeySequence {
  public readonly text: string;
  public readonly chords: IReadOnlyList<KeyChord>;

  private constructor(text: string, chords: IReadOnlyList<KeyChord>) {
    this.text = text;
    this.chords = chords;
  }

  public get first(): KeyChord {
    return this.chords.get(0);
  }

  public static parse(text: string, primary: string): KeySequence {
    const parts: readonly string[] = text.split(Resources.sequenceJoiner).filter(t => !String.isNullOrEmpty(t));
    if (parts.length > Resources.sequenceChordLimit)
      throw new ArgumentException(Resources.formatKeySequenceLength(text, Resources.sequenceChordLimit), Resources.keyParameter);
    const chords: List<KeyChord> = new List<KeyChord>(parts.map(t => KeyChord.parse(t, primary)));

    return new KeySequence(text, chords.count() === 0 ? new List<KeyChord>([KeyChord.parse(text, primary)]) : chords);
  }

  public equals(other: KeySequence): boolean {
    return this.chords.count() === other.chords.count() && this.chords.zip(other.chords, (mine, theirs) => mine.equals(theirs)).all(t => t);
  }

  public label(platform: string): string {
    return this.chords.select(t => t.label(platform)).toArray().join(Resources.sequenceJoiner);
  }
}
