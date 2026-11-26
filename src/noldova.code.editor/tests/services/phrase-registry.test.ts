/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { PhraseRegistry, PluralPhrase } from "@noldova/code.editor";

import { Expect } from "../support/expect.js";

@TestClass
export class PhraseRegistryTests {
  @TestMethod
  public placesValuesAndPicksThePluralFormTheLocalesRulesGive(): void {
    const phrases = new PhraseRegistry();
    phrases.add("en", { "lines": new PluralPhrase("{count} lines", undefined, "{count} line"), "match": "Match {index} of {count}", "open": "{missing} stays" });
    phrases.add("pl", { "lines": new PluralPhrase("{count} wiersza", undefined, "{count} wiersz", undefined, "{count} wiersze", "{count} wierszy") });

    Expect.same(["1 line", "1,000 lines", "Match two of 7", "{missing} stays"], [phrases.format("lines", { count: 1 }), phrases.format("lines", { count: 1000 }),
      phrases.format("match", { index: "two", count: 7 }), phrases.format("open")]);
    phrases.locale = "pl";
    Expect.same(["1 wiersz", "3 wiersze", "5 wierszy", "1,5 wiersza", "Match 2 of 7"], [phrases.format("lines", { count: 1 }), phrases.format("lines", { count: 3 }),
      phrases.format("lines", { count: 5 }), phrases.format("lines", { count: 1.5 }), phrases.format("match", { index: 2, count: 7 })]);
  }

  @TestMethod
  public fallsBackFromTheRegionToTheLanguageToEnglishToTheKeyAndToOtherWithoutACount(): void {
    const parent = new PhraseRegistry();
    parent.add("en", { "close": "Close", "items": new PluralPhrase("Items"), "only": new PluralPhrase("Some") });
    const child = new PhraseRegistry(parent);
    const german = child.add("de", { "close": "Schließen" });
    child.add("de-CH", { "items": new PluralPhrase("Einträge", undefined, "Ein Eintrag") });
    child.add("ar", { "only": new PluralPhrase("Some", "None", undefined, "Both"), "bare": new PluralPhrase("Bare") });

    Assert.areEqual("en", child.locale);
    parent.locale = "de-CH";
    Expect.same(["Schließen", "Einträge", "Ein Eintrag", "Some", "Some", "missing.key"], [child.format("close"), child.format("items"), child.format("items", { count: 1 }),
      child.format("only", { count: 1 }), child.format("only", { count: 0 }), child.format("missing.key")]);
    german[Symbol.dispose]();
    Assert.areEqual("Close", child.format("close"));
    child.locale = "ar";
    Expect.same(["None", "Both", "Some", "Some", "Some", "Bare", "Bare", "Bare", "Bare"], [child.format("only", { count: 0 }), child.format("only", { count: 2 }),
      child.format("only", { count: "two" }), child.format("only", { count: 3 }), child.format("only", { count: 11 }), child.format("bare", { count: 0 }),
      child.format("bare", { count: 2 }), child.format("bare", { count: 3 }), child.format("bare", { count: 11 })]);
  }
}
