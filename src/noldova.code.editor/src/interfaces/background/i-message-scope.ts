/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Resources } from "../../resources.js";
import type { IMessagePostOptions } from "./i-message-post-options.js";
import type { IWorkerJobMessage } from "./i-worker-job-message.js";

export interface IMessageScope {
  addEventListener(type: typeof Resources.message, listener: (event: IWorkerJobMessage) => void): void;

  postMessage(message: unknown, options: IMessagePostOptions): void;
}
