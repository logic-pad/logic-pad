# @logic-pad/core

The core API of Logic Pad.

## Developing Logic Core

This package is part of Logic Pad. [Bun >=v1.1.0](https://bun.sh/) is required for this package.

```bash
# 1. Clone this repository
git clone https://github.com/logic-pad/logic-pad.git

# 2. Restore dependencies
cd logic-pad
bun install
cd packages/logic-core
bun install

# 3. Build the library
bun build
```

To test your changes in realtime in Logic Pad, simply run Logic Pad using the Vite dev server.

```bash
# In the logic-pad directory
bun run dev
```

Note that Logic Pad bundles the `src` directory of this package directly with Vite instead of using the transpiled
code in the `dist` output folder, which is for publishing only.
