/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestClass, TestMethod } from "@noldova/context.testing";

import { PhraseRegistry, PluralPhrase } from "@noldova/code.editor";

import { Expect } from "../support/expect.js";

@TestClass
export class PluralPhraseTests {
  @TestMethod
  public givesEachCategoryItsFormAndOtherWhereNoneIsGiven(): void {
    const phrases: PhraseRegistry = new PhraseRegistry();
    phrases.locale = "ar";
    phrases.add("ar", { "items": new PluralPhrase("other", "zero", "one", "two", "few", "many") });
    const bare: PluralPhrase = new PluralPhrase("rest");

    Expect.same(["zero", "one", "two", "few", "many", "other"], [0, 1, 2, 3, 11, 100].map(t => phrases.format("items", { count: t })));
    Expect.same(["rest", undefined, undefined, undefined, undefined, undefined], [bare.other, bare.zero, bare.one, bare.two, bare.few, bare.many]);
  }
}
