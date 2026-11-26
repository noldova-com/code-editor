/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiffSpan, IBackgroundJob, IDiffAlgorithm } from "@noldova/code.editor";
import { Enumerable, type IReadOnlyList, List } from "@noldova/context.collections";

import type { LineDiffInput } from "../models/line-diff-input.js";
import { Resources } from "../resources.js";
import { LineChangeCodec } from "./line-change-codec.js";

export class LineDiffJob implements IBackgroundJob<LineDiffInput, Int32Array> {
  public readonly name: string;
  private readonly algorithm: IDiffAlgorithm;

  public constructor(algorithm: IDiffAlgorithm) {
    this.algorithm = algorithm;
    this.name = Resources.formatLineDiffJob(algorithm.id);
  }

  public *steps(input: LineDiffInput): Generator<void, Int32Array, void> {
    yield;
    const ranges: IReadOnlyList<DiffSpan> = this.algorithm.lines(new List<string>(input.original), new List<string>(input.modified));
    const count: number = ranges.count();
    const values: Int32Array = new Int32Array(count * LineChangeCodec.width);
    for (const start of Enumerable.range(0, Math.ceil(count / Resources.encodeSliceLength)).select(t => t * Resources.encodeSliceLength)) {
      yield;
      LineChangeCodec.encodeInto(values, ranges, start, Math.min(count, start + Resources.encodeSliceLength));
    }

    return values;
  }
}
