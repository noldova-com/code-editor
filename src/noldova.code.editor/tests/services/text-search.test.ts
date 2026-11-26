/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { TestClass, TestMethod } from "@noldova/context.testing";

import { SearchPatternException, SearchQuery, TextDocument, TextPosition, TextSearch } from "@noldova/code.editor";
import type { TextRange } from "@noldova/code.editor";

import { Expect } from "../support/expect.js";

const DOCUMENT = TextDocument.fromText("Foo foo.bar\nfood (foo)\r\nÉtéfoo été");

@TestClass
export class TextSearchTests {
  @TestMethod
  public findsALiteralTextInEveryLineIgnoringCaseUnlessAskedWithRegexCharactersTakenAsText(): void {
    Expect.same(["0:0-0:3", "0:4-0:7", "1:0-1:3", "1:6-1:9", "2:3-2:6"], TextSearchTests.spans(new TextSearch(new SearchQuery("foo")).findAll(DOCUMENT)));
    Expect.same(["0:0-0:3"], TextSearchTests.spans(new TextSearch(new SearchQuery("Foo", false, true)).findAll(DOCUMENT)));
    Expect.same(["1:5-1:10"], TextSearchTests.spans(new TextSearch(new SearchQuery("(foo)")).findAll(DOCUMENT)));
    Expect.same(["0:6-0:9"], TextSearchTests.spans(new TextSearch(new SearchQuery("o.b")).findAll(DOCUMENT)));
  }

  @TestMethod
  public findsWholeWordsOnlyWithLettersOfAnyScriptAsWordCharacters(): void {
    Expect.same(["0:0-0:3", "0:4-0:7", "1:6-1:9"], TextSearchTests.spans(new TextSearch(new SearchQuery("foo", false, false, true)).findAll(DOCUMENT)));
    Expect.same(["2:7-2:10"], TextSearchTests.spans(new TextSearch(new SearchQuery("été", false, false, true)).findAll(DOCUMENT)));
  }

  @TestMethod
  public findsARegularExpressionSkippingEmptyMatchesAndOnlyInTheLinesAsked(): void {
    Expect.same(["1:0-1:4", "1:6-1:9"], TextSearchTests.spans(new TextSearch(new SearchQuery("fo+d?", true)).findAll(DOCUMENT, 1, 2)));
    Expect.same([], TextSearchTests.spans(new TextSearch(new SearchQuery("x*", true)).findAll(DOCUMENT)));
    Expect.same([], TextSearchTests.spans(new TextSearch(new SearchQuery("")).findAll(DOCUMENT)));
  }

  @TestMethod
  public movesToTheNextOrPreviousMatchFromAPositionWrappingAroundTheDocument(): void {
    const search = new TextSearch(new SearchQuery("foo", false, false, true));

    Expect.same(["0:4-0:7", "0:0-0:3", "0:0-0:3", "1:6-1:9", "none", "none"], TextSearchTests.spans([
      search.next(DOCUMENT, new TextPosition(0, 1)),
      search.next(DOCUMENT, new TextPosition(1, 7)),
      search.previous(DOCUMENT, new TextPosition(0, 4)),
      search.previous(DOCUMENT, new TextPosition(0, 0)),
      new TextSearch(new SearchQuery("none")).next(DOCUMENT, new TextPosition(0, 0)),
      new TextSearch(new SearchQuery("none")).previous(DOCUMENT, new TextPosition(0, 0))
    ]));
  }

  @TestMethod
  public replacesEachMatchWithTheTextOrWithTheRegularExpressionsGroupsFilledIn(): void {
    const literal = new TextSearch(new SearchQuery("foo", false, false, true));
    const regex = new TextSearch(new SearchQuery("(f)(o+)", true));

    Expect.same(["$1x", "$1x"], literal.replaceEdits(DOCUMENT, literal.findAll(DOCUMENT, 0, 1), "$1x").select(t => t.text).toArray());
    Expect.same(["oof", "oof"], regex.replaceEdits(DOCUMENT, regex.findAll(DOCUMENT, 1, 2), "$2$1").select(t => t.text).toArray());
  }

  @TestMethod
  public givesOneLinesMatchesAsColumnPairsAsFindAllDoesEachTimeSkippingEmptyMatchesWholeCharactersAtATime(): void {
    const search: TextSearch = new TextSearch(new SearchQuery("foo"));
    const regex: TextSearch = new TextSearch(new SearchQuery("x*b+", true));
    const emoji: TextDocument = TextDocument.fromText("\u{1F600}b\u{1F600}bb");
    const pairs = (line: number): readonly number[] => search.findAll(DOCUMENT, line, line + 1).toArray().flatMap(t => [t.start.column, t.end.column]);

    Expect.same([[0, 3, 4, 7], [0, 3, 6, 9], [3, 6]], [0, 1, 2].map(t => search.columnsIn(DOCUMENT, t)));
    Expect.same([0, 1, 2].map(pairs), [0, 1, 2].map(t => search.columnsIn(DOCUMENT, t)));
    Expect.same([[2, 3, 5, 7], [2, 3, 5, 7]], [regex.columnsIn(emoji, 0), regex.columnsIn(emoji, 0)]);
    Expect.same([[], [], []], [new TextSearch(new SearchQuery("x*", true)).columnsIn(emoji, 0), new TextSearch(new SearchQuery("")).columnsIn(DOCUMENT, 0), new TextSearch(new SearchQuery("bar")).columnsIn(DOCUMENT, 1)]);
  }

  @TestMethod
  public refusesARegularExpressionThatDoesntCompileNamingIt(): void {
    Expect.throwsWhere(() => new TextSearch(new SearchQuery("(a", true)), SearchPatternException, error => error.pattern === "(a" && error.message.startsWith("The search pattern (a isn't a valid regular expression: SyntaxError") && error.cause instanceof SyntaxError && error.name === "SearchPatternException");
  }

  private static spans(ranges: Iterable<TextRange | null>): readonly string[] {
    return [...ranges].map(t => Object.isNull(t) ? "none" : `${t.start.line}:${t.start.column}-${t.end.line}:${t.end.column}`);
  }
}
