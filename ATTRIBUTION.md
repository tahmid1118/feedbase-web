# Third-party assets

## Icons — coolicons

Most icons under `components/icons/` are sourced from **coolicons**
(https://coolicons.cool/, free tier, https://github.com/krystonschwarze/coolicons),
licensed under **CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/).

`components/icons/index.ts` documents which lucide-compatible name maps to
which coolicons source file. A handful of icons (`ChevronsUpDown`, `LogIn`,
`MailX`) are composed from coolicons paths (a mirror, a stack, or a
composite), and eight (`Bug`, `Film`, `GitBranch`, `Headset`, `KeyRound`,
`Sparkles`, `ThumbsUp`/`Vote`, `Zap`) are hand-drawn in the same visual style
(24×24 viewBox, 2px round-cap `currentColor` stroke) because coolicons' free
tier has no equivalent glyph for them.

To add a new coolicons-sourced icon, add a row to
`scripts/generate-coolicons-icons.mjs`'s `ICONS` table and re-run
`node scripts/generate-coolicons-icons.mjs`.
