/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module "@noldova/code.editor.textmate/services/pattern-cache.js" {
  export class PatternCache extends Map<string, RegExp | Error> {
    public constructor(limit: number);
    public override get(pattern: string): RegExp | Error | undefined;
    public override set(pattern: string, compiled: RegExp | Error): this;
  }
}
