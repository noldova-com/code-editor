# @noldova/code.editor.textmate

The code editor's highlighting from TextMate grammars, through Shiki: `TextMateContribution`, which registers the package with an `EditorRegistries` set; `TextMateHighlighter`, which loads a language's grammar on its first use; `TextMateTokenizer` and `TextMateState`, a line tokenizer that carries the grammar's state; `ScopeRules`, the TextMate scopes mapped onto the core's token types; and `TextMateLanguages`, the 33 languages it gives by default, each with its grammar and indent.
A host replaces any of those defaults through the contribution's options, and another package's highlighter can take a language over through the core's highlighter registry.
All of the code editor's Shiki code and types are here; the core has none.
[documents/ARCHITECTURE.md](../../documents/ARCHITECTURE.md) says how its parts fit together.
