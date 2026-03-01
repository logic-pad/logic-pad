# Logic Pad

A modern web app to create custom Logic Grid puzzles from Islands of Insight.

This is intended as an unofficial companion to Islands of Insight, allowing you to create and play custom puzzles.
It is not a replacement of the full game.
You are strongly recommended to discover the grid rules in-game before using Logic Pad.

## Developing Logic Pad

[Bun >=v1.1.0](https://bun.sh/) is required for this project.

```bash
# 1. Clone this repository
git clone https://github.com/logic-pad/logic-pad.git

# 2. Restore dependencies
cd logic-pad
bun install

# 3. Run the dev server
bun dev

# You can now develop with hot module reload
```

Several files in this project are automatically generated. If you have modified anything in `package/logic-core`, you
should regenerate those files with `bun build` in the logic-core subpackage.
