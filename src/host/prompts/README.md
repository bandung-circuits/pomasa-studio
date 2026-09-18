# prompts

Host-side **prompt i18n** — not Studio UI language.

Warmup seeds, run kickoff, design-mode, and generator system prompts follow `pomasa.json` `language.blueprint` (create-form language, then `user_input.md` if the descriptor has no language). Missing/Chinese → `zh`; anything else → `en`, so English MAS are not primed in Chinese.
