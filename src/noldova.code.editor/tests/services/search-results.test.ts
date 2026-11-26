/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type IReadOnlyList, List } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { SearchQuery, SearchResults, TextDocument, TextEdit, TextPosition, TextRange, TextSearch } from "@noldova/code.editor";

import { CountingSearch } from "../fixtures/counting-search.fixture.js";
import { Expect } from "../support/expect.js";

@TestClass
export class SearchResultsTests {
  @TestMethod
  public searchesOnlyTheLinesAskedAtOnceThenTheRestInBackgroundSlicesReadingTheClockOnceEvery64LinesEachLineOnce(): void {
    const document: TextDocument = SearchResultsTests.documentOf(SearchResultsTests.linesOf(200));
    const search: CountingSearch = new CountingSearch(new SearchQuery("foo"));
    using results = new SearchResults(document, search);
    let reads: number = 0;

    Expect.same(["3:0-3:3", "3:6-3:9"], SearchResultsTests.spans(results.matchesIn(2, 4)));
    Expect.same([[2, 3], 2, false], [search.searched, results.count, results.complete]);
    Assert.areEqual(true, results.advance(() => ++reads < 0));
    Expect.same([1, 64, 63], [reads, search.searched.length, search.searched.at(-1)]);
    Assert.areEqual(false, results.advance(() => ++reads > 0));
    Assert.areEqual(false, results.advance(() => ++reads > 0));

    Expect.same([3, Array.from({ length: 200 }, (_, i) => i)], [reads, search.searched.toSorted((a, b) => a - b)]);
    Expect.same([134, true], [results.count, results.complete]);
    Expect.same(["198:0-198:3", "198:8-198:11"], SearchResultsTests.spans(results.matchesIn(198, 300)));
  }

  @TestMethod
  public readsTheClockSoonerOnLongLinesOnceAbout4096CharactersWereSearched(): void {
    const document: TextDocument = SearchResultsTests.documentOf(Array.from({ length: 10 }, () => `foo${"x".repeat(1497)}`));
    const search: CountingSearch = new CountingSearch(new SearchQuery("foo"));
    using results = new SearchResults(document, search);
    let reads: number = 0;

    Assert.areEqual(true, results.advance(() => ++reads < 0));
    Expect.same([1, [0, 1, 2], 4500], [reads, [...search.searched], search.searchedCharacters]);
    Assert.areEqual(false, results.advance(() => ++reads > 0));

    Expect.same([3, 10, 10, true], [reads, search.searched.length, results.count, results.complete]);
  }

  @TestMethod
  public movesToTheNextOrPreviousMatchFromAPositionAsTheWholeSearchDoesBeforeAndAfterTheBackgroundFinishes(): void {
    const document: TextDocument = SearchResultsTests.documentOf(["bar", ...SearchResultsTests.linesOf(2000), "foo end"]);
    const search: TextSearch = new TextSearch(new SearchQuery("foo"));
    const positions: readonly TextPosition[] = [0, 1, 2, 4, 1500, 2000, 2001].flatMap(t => [new TextPosition(t, 0), new TextPosition(t, 5)]);
    const expected: readonly string[] = SearchResultsTests.spans(positions.flatMap(t => [search.next(document, t), search.previous(document, t)]));
    using fresh = new SearchResults(document, search);
    using done = new SearchResults(document, search);
    using none = new SearchResults(document, new TextSearch(new SearchQuery("none")));

    const before: readonly string[] = SearchResultsTests.spans(positions.flatMap(t => [fresh.next(t), fresh.previous(t)]));
    done.advance(() => true);
    const after: readonly string[] = SearchResultsTests.spans(positions.flatMap(t => [done.next(t), done.previous(t)]));
    const missing: readonly string[] = SearchResultsTests.spans([none.next(new TextPosition(5, 0)), none.previous(new TextPosition(5, 0))]);
    none.advance(() => true);

    Expect.same([false, expected, expected], [fresh.complete, before, after]);
    Expect.same(["none", "none", "none", "none"], [...missing, ...SearchResultsTests.spans([none.next(new TextPosition(5, 0)), none.previous(new TextPosition(5, 0))])]);
  }

  @TestMethod
  public givesEachMatchsIndexInTheDocumentAndEveryMatchForAReplaceFinishingTheSearchFirst(): void {
    const document: TextDocument = SearchResultsTests.documentOf(SearchResultsTests.linesOf(3000));
    const search: TextSearch = new TextSearch(new SearchQuery("foo"));
    using results = new SearchResults(document, search);
    results.matchesIn(2000, 2010);

    const all: IReadOnlyList<TextRange> = results.all();

    Expect.same(SearchResultsTests.spans(search.findAll(document)), SearchResultsTests.spans(all));
    Expect.same(all.select((_, i) => i).toArray(), all.select(t => results.indexOf(t)).toArray());
    Assert.areEqual(-1, results.indexOf(TextRange.of(3, 1, 3, 4)));
    Assert.areEqual(true, results.complete);
  }

  @TestMethod
  public reSearchesOnlyTheEditedLinesBeforeInsideAndPastTheSearchedPartKeepingTheMatchesOfTheRest(): void {
    const document: TextDocument = SearchResultsTests.documentOf(SearchResultsTests.linesOf(3000));
    const search: CountingSearch = new CountingSearch(new SearchQuery("foo"));
    using results = new SearchResults(document, search);
    using partial = new SearchResults(document, new TextSearch(new SearchQuery("foo")));
    const expected = (): readonly string[] => SearchResultsTests.spans(new TextSearch(new SearchQuery("foo")).findAll(document));

    results.advance(() => true);
    search.searched.length = 0;
    document.apply(new List([new TextEdit(TextRange.of(10, 0, 11, 0), "foo\nfoo\nfoo\n"), new TextEdit(TextRange.of(2000, 0, 2000, 3), "x")]));
    document.apply(new List([new TextEdit(TextRange.of(1500, 0, 1500, 0), "foo\n")]));
    Expect.same([false, 2000], [results.complete, results.count]);
    Expect.same(expected(), SearchResultsTests.spans(results.all()));
    Expect.same([10, 11, 12, 13, 1500, 1501, 2003], search.searched.toSorted((a, b) => a - b));

    let budget: number = 2;
    partial.advance(() => --budget > 0);
    document.apply(new List([new TextEdit(TextRange.of(50, 0, 150, 0), "foo")]));
    document.apply(new List([new TextEdit(TextRange.of(2000, 0, 2000, 0), "foo ")]));
    Expect.same([expected(), expected()], [SearchResultsTests.spans(partial.all()), SearchResultsTests.spans(results.all())]);
  }

  @TestMethod
  public findsTheMatchesInViewOfA1000000LineDocumentSearchingOnlyTheLinesInViewAndFollowsAnEditSearchingNone(): void {
    const document: TextDocument = SearchResultsTests.documentOf(Array.from({ length: 1_000_000 }, (_, i) => `line ${i}`));
    const search: CountingSearch = new CountingSearch(new SearchQuery("line 5"));
    using results = new SearchResults(document, search);
    const searches: number[] = [];
    const edits: number[] = [];

    for (let line: number = 500_000; line < 500_020; line++) {
      const before: number = search.searched.length;
      results.matchesIn(line, line + 60);
      const searched: number = search.searched.length;
      document.apply(new List([new TextEdit(TextRange.of(line, 0, line, 0), "x\n")]));
      searches.push(searched - before);
      edits.push(search.searched.length - searched);
    }

    Expect.same([], SearchResultsTests.spans(results.matchesIn(500_000, 500_001)));
    Assert.isTrue(Math.max(...searches) <= 60, `The views searched ${searches.join(", ")} lines.`);
    Expect.same(new Array<number>(20).fill(0), edits);
  }

  private static spans(ranges: Iterable<TextRange | null>): readonly string[] {
    return [...ranges].map(t => Object.isNull(t) ? "none" : `${t.start.line}:${t.start.column}-${t.end.line}:${t.end.column}`);
  }

  private static documentOf(lines: readonly string[]): TextDocument {
    return TextDocument.fromText(lines.join("\n"));
  }

  private static linesOf(count: number): readonly string[] {
    return Array.from({ length: count }, (_, i) => i % 3 === 0 ? `foo ${i} foo` : `bar ${i}`);
  }
}
