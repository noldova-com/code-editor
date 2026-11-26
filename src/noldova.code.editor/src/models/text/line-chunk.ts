/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { BinarySearchService } from "@noldova/context.collections";

import { Required } from "../../services/required.js";

export class LineChunk {
  public length: number;
  private source: string | null;
  private starts: readonly number[];
  private textEnds: readonly number[];
  private lineTexts: string[];
  private lineEndings: string[];
  private count: number;

  private constructor(source: string | null, starts: readonly number[], textEnds: readonly number[], texts: string[], endings: string[]) {
    this.source = source;
    this.starts = starts;
    this.textEnds = textEnds;
    this.lineTexts = texts;
    this.lineEndings = endings;
    this.count = Object.isNull(source) ? texts.length : textEnds.length;
    this.length = Object.isNull(source) ? LineChunk.measure(texts, endings) : source.length;
  }

  public static ofLines(texts: string[], endings: string[]): LineChunk {
    return new LineChunk(null, [], [], texts, endings);
  }

  public static ofSource(source: string, starts: readonly number[], textEnds: readonly number[]): LineChunk {
    return new LineChunk(source, starts, textEnds, [], []);
  }

  public get lineCount(): number {
    return this.count;
  }

  public get texts(): readonly string[] {
    this.split();

    return this.lineTexts;
  }

  public get endings(): readonly string[] {
    this.split();

    return this.lineEndings;
  }

  public textAt(line: number): string {
    if (Object.isNull(this.source))
      return Required.at(this.lineTexts, line);

    return this.source.slice(Required.at(this.starts, line), Required.at(this.textEnds, line));
  }

  public endingAt(line: number): string {
    if (Object.isNull(this.source))
      return Required.at(this.lineEndings, line);

    return this.source.slice(Required.at(this.textEnds, line), Required.at(this.starts, line + 1));
  }

  public text(): string {
    if (!Object.isNull(this.source))
      return this.source;
    const parts: string[] = [];
    for (let index = 0; index < this.count; index++)
      parts.push(Required.at(this.lineTexts, index), Required.at(this.lineEndings, index));

    return parts.join(String.empty);
  }

  public replace(start: number, deleteCount: number, texts: readonly string[], endings: readonly string[]): void {
    this.split();
    this.lineTexts = this.lineTexts.slice(0, start).concat(texts, this.lineTexts.slice(start + deleteCount));
    this.lineEndings = this.lineEndings.slice(0, start).concat(endings, this.lineEndings.slice(start + deleteCount));
    this.count = this.lineTexts.length;
    this.length = LineChunk.measure(this.lineTexts, this.lineEndings);
  }

  public offsetOf(line: number): number {
    if (!Object.isNull(this.source))
      return Required.at(this.starts, line);
    let offset: number = 0;
    for (let index = 0; index < line; index++)
      offset += Required.at(this.lineTexts, index).length + Required.at(this.lineEndings, index).length;

    return offset;
  }

  public lineAt(offset: number): number {
    if (!Object.isNull(this.source))
      return Math.min(BinarySearchService.floorIndex(this.starts, offset), this.count - 1);
    let rest: number = offset;
    let line: number = 0;
    let length: number = Required.at(this.lineTexts, 0).length + Required.at(this.lineEndings, 0).length;
    while (rest >= length && line < this.count - 1) {
      rest -= length;
      line++;
      length = Required.at(this.lineTexts, line).length + Required.at(this.lineEndings, line).length;
    }

    return line;
  }

  private split(): void {
    if (Object.isNull(this.source))
      return;
    const texts: string[] = [];
    const endings: string[] = [];
    for (let index = 0; index < this.count; index++) {
      texts.push(this.textAt(index));
      endings.push(this.endingAt(index));
    }
    this.lineTexts = texts;
    this.lineEndings = endings;
    this.starts = [];
    this.textEnds = [];
    this.source = null;
  }

  private static measure(texts: readonly string[], endings: readonly string[]): number {
    let length: number = 0;
    for (const text of texts)
      length += text.length;
    for (const ending of endings)
      length += ending.length;

    return length;
  }
}
