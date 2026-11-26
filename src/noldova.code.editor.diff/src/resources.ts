/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Resources {
  public static readonly lineFeed: string = "\n";
  public static readonly defaultAlgorithmId: string = "noldova.diff";
  public static readonly diffContribution: string = "noldova.code.editor.diff";
  public static readonly lineDiffJobPrefix: string = "code.editor.diff.lines:";
  public static readonly encodeSliceLength: number = 4096;
  public static readonly defaultContextLines: number = 3;
  public static readonly defaultMinimumHiddenLines: number = 3;
  public static readonly defaultCharacterDiffLimit: number = 20000;
  public static readonly lineChangeWidth: number = 4;
  public static readonly originalStartOffset: number = 0;
  public static readonly originalEndOffset: number = 1;
  public static readonly modifiedStartOffset: number = 2;
  public static readonly modifiedEndOffset: number = 3;

  public static formatLineDiffJob(algorithmId: string): string {
    return `${Resources.lineDiffJobPrefix}${algorithmId}`;
  }
}
