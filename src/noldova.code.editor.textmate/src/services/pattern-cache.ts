/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

export class PatternCache extends Map<string, RegExp | Error> {
  private readonly limit: number;

  public constructor(limit: number) {
    super();
    this.limit = limit;
  }

  public override get(pattern: string): RegExp | Error | undefined {
    const compiled: RegExp | Error | undefined = super.get(pattern);
    if (!Object.isUndefined(compiled)) {
      super.delete(pattern);
      super.set(pattern, compiled);
    }

    return compiled;
  }

  public override set(pattern: string, compiled: RegExp | Error): this {
    if (this.size >= this.limit)
      for (const oldest of this.keys()) {
        this.delete(oldest);
        break;
      }

    return super.set(pattern, compiled);
  }
}
