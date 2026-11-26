/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface IBackgroundJob<TInput, TOutput> {
  readonly name: string;

  steps(input: TInput): Generator<void, TOutput, void>;
}
