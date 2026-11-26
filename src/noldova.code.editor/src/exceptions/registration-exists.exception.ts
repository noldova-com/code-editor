/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";

export class RegistrationExistsException extends Exception {
  public override readonly name: string = Resources.registrationExistsExceptionName;

  public readonly registry: string;
  public readonly id: string;

  public constructor(registry: string, id: string) {
    super(Resources.formatRegistrationExists(registry, id));

    this.registry = registry;
    this.id = id;
  }
}
