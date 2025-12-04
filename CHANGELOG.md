# 4/12/2025

- Area numbers, letters, house numbers and hollow letters that are placed between tiles now require all touching tiles to be of the same color
  - This is now supported by the backtrack and universal solvers
- Removed the z3 solver
- Improved card style for better readability and touchscreen support
- The tile tool can now be dragged across tiles
- The cspuz solver can now be used in more edge cases involving lotuses/galaxies
- The solver support indicator now accurately reflects whether the selected symbol is supported in its current placement
- Fixed the backtrack solver counting non-logic symbols (e.g. the hidden symbol) in symbols per region rule
- Fixed text highlight being triggered by double-clicking on the grid in Firefox

# 1/12/2025

- Reworked all color themes again to improve contrast
- Fixed notification layout when there are many notifications

# 30/11/2025

- Grid validation now runs automatically when a puzzle is loaded
- Fixed repeated server errors in the collection sidebar for loved collections
- Fixed missing grid validation when editing a published puzzle

# 24/11/2025

- The No Loops rule now only highlights the looped tiles
- Fixed No Loops rule crashing on wrap-around grids
- You can now use cmd+enter or ctrl+enter to add a new line in comments
- You can now preview theme colors in the theme switcher

# 22/11/2025

- Added No Loops rule
- You can now filter collections by type
- Fixed solvers not aborting properly
- Improved comment sidebar UI

# 20/11/2025

- Added Hollow Letter symbol
- Fixed `GridData.copyTiles` not shifting symbol positions
- Fixed incorrect assumptions about symbols per region rule in the auto solver
- Improved color contrast for color radio buttons

# 18/11/2025

- Updated the design of Dead Ends to be compatible with viewpoints and consistent with Focus numbers
- Updated solvers to indicate underclued grids with no deducible tiles
- You can now reverse the order of puzzles in a collection
  - Automatic collections are sorted by newest first by default
- Automatic collections no longer appear on the front page
  - If set to public, these collections will appear in your profile page instead
- Newest puzzles and collections on the front page are now cached
  - New updates may be delayed by up to 5 minutes

# 16/11/2025

- Improved markdown styling across the site
- Added [Terms of Service](/terms)
- Switched from Vercel Speed Insights to Sentry for anonymous performance monitoring
  - See updated [Privacy Policy](/privacy-policy) for details.

# 15/11/2025

- Migrated to daisyUI v5 with tighter layout and color refresh
- The source code of Logic Pad is now at [https://github.com/logic-pad](https://github.com/logic-pad)
- Fixed clipboard tool on mobile and improve copy and paste visualization
- The editor now falls back to its own clipboard if system clipboard access is denied

# 14/11/2025

- Added the clipboard tool for copying and pasting grid areas and rules across pages
- Invalid create links now redirect to the solve page

# 7/11/2025

- Added Dead Ends variant to Focus Symbol
  - Dead Ends are Focus Numbers of 1 that can stack with other symbols

# 3/11/2025

- Added Connect Zones rule to connect colored cells within each zone separately
- Added Exact Count Per Zone rule to specify exact number of colored cells in each zone
- Oversized grids are now validated in the background
- Optimized validation performance for Connect All rule

# 2/11/2025

- Fixed broken canvas render in huge grids by lowering DPI

# 7/10/2025

- Added support for more instruments in music grids
  - Added violin, xylophone, acoustic guitar, electric guitar, flute and trumpet
  - Only the necessary instruments are loaded when playing a music grid
- Invalid note names in music grids no longer crash the site
- Fixed config popup disappearing in music grids when using the canvas grid renderer
- Tweaked random time and frequency offset in music grids

# 5/10/2025

- Drum samples are no longer cut off when the BPM is high
- Fixed music grid sometimes crashing when resizing the grid

# 4/10/2025

- You can now add private puzzles to private collections
  - All puzzles must be public for a collection to become public
- Optimized the random puzzle algorithm
- Fixed puzzle cards being clicked when using drag-and-drop
- Improve loading animation in some areas for stable page layout

# 2/10/2025

- Improved validation error messages to be more user-friendly

# 26/9/2025

- Optimized rendering for Viewpoint, Lotus, Minesweeper and Focus symbols by using pre-rendered SVGs
- Optimized symbol rendering on very large grids

# 24/9/2025

- House symbols now contains a number and can be affected by Off-by-X rule

# 23/9/2025

- Added House symbol
  - Houses must connect to exactly one other house
- When a number symbol is selected, you can now scroll to adjust its number
- You can now use right click to delete symbols

# 21/9/2025

- Added Different Count Per Zone rule
  - Zones of the same size have different numbers of cells of a specified color
- Added support page for Logic Pad Supporter program

# 20/9/2025

- Online features are now available at logic-pad.com
  - All dev.logic-pad.com links will redirect to the main site automatically
- Convert important buttons to links for accessibility
- Most infinite-scrolling lists now load the next page automatically

# 19/9/2025

**PREVIEW BRANCH**

- Added support for user mentions in comments
  - Type `@` followed by the username to mention a user
  - Mentioned users will receive a notification
- Profile page optimizations and UI improvements
- The user avatar is now shown for a user's "created puzzles" collection

# 18/9/2025

**PREVIEW BRANCH**

- Fixed validation for diagonal lotus at tile corners

# 14/9/2025

**PREVIEW BRANCH**

- Added notifications for
  - New comments on your puzzles
  - New puzzles from collections you follow

# 13/9/2025

**PREVIEW BRANCH**

- Added puzzles series, a special type of collection where
  - All puzzles are created by the collection owner
  - Each puzzle can only belong to one series
  - You can easily navigate to the corresponding series when viewing a puzzle
- "I'm feeling lucky" no longer picks puzzles made by the same user
- Fixed profile page showing all solved puzzles as being created by the user

# 9/9/2025

**PREVIEW BRANCH**

- Added a front page button to open a random puzzle
- Added puzzle publish date display
- Fixed pagination for solved puzzles collection

# 8/9/2025

**PREVIEW BRANCH**

- Further improvement to site updater
  - Site updates are now applied automatically if indicated by the server
  - Online mode is not allowed unless the site is up to date with the server
- Added a comment count indicator in the "View comments" button
- Fixed the comment sidebar being trapped in the "puzzle solved" box
- Fixed perfection mode switch not working due to cached puzzle data
- Fixed online metadata missing in perfection mode
- Fixed pluralization of counts in various places

# 7/9/2025

**PREVIEW BRANCH**

- Added tile counting overlay for focus and minesweeper symbols

# 6/9/2025

**PREVIEW BRANCH**

- Improved the symbol insertion cursor to indicate current action
- Added shortcuts to close the config popup and to delete the selected item
- Added shortcuts to set direction-related configs
- Added shortcuts to select preset tools
- Preset tools can now be re-ordered via drag-and-drop
- Added a new site config to set keyboard layout for toolbox shortcuts
- Mouse clicks on the grid are now blocked when the config popup is open

# 4/9/2025

**PREVIEW BRANCH**

- Fixed alternate solution logic in cspuz solver
- Added Sentry logging to the client and the API server
- Updated the privacy policy to reflect the use of Sentry

# 2/9/2025

**PREVIEW BRANCH**

- Added a dedicated page for followed collections
- Expanded the front page and profile page to include 2 rows of items
- Added bulk puzzle deletion in My stuff page
- Optimized data loading in Search and My stuff pages
- Optimized data loading in collection page after editing collection details
- Fixed draggable cards not responding to clicks
- Fixed cards not being draggable on touch screens

# 1/9/2025

**PREVIEW BRANCH**

- Added a toggle for flood fill on touch screens
- Updated the design of private puzzle/collection cards
- Reworked the site updater for future updates
  - Every browser tab of Logic Pad now preserves its own state when the update is being applied
  - Accepting the update prompt no longer triggers exit confirmation dialogs
  - The update prompt is now available in all pages except the uploader, where updating may cause data loss

# 31/8/2025

**PREVIEW BRANCH**

- Added a guided tour of the editor for new users
- Improved checksum detection for pattern rules
- Fixed some color themes having invisible text

# 26/8/2025

**PREVIEW BRANCH**

- The editor now selects the color tool by default
- Added a cursor for symbol insertion
- Added a name and explanation for each symbol / rule
- Added expandable explanation for symbol / rule config fields
- Fixed modifier hotkeys
- Fixed music grids passing puzzle checklist with no solution provided
- Fixed exit blocker in puzzle editor not respecting site settings
- Fixed instruction overflow causing the accent bar to be cut off

# 25/8/2025

**PREVIEW BRANCH**

- Fixed uploader failing due to server rate limit

# 24/8/2025

**PREVIEW BRANCH**

- Added support for drag-and-drop reordering of puzzles in collections
- Added footer with rules and privacy policy
- Layout fixes for mobile
- Improved the exit blocking dialog to only show when necessary
- Search queries are now reserved for logged in users only to prevent abuse

# 23/8/2025

**PREVIEW BRANCH**

- Added additional dialog text for explanation when puzzle checklist is failing
- Added puzzle checksum detection
- Fixed back navigation lock in sign in page
- Clicking on a private puzzle that you own now directs you to the editor

# 22/8/2025

**PREVIEW BRANCH**

- Added puzzle uploader
  - Paste offline puzzle links to publish them in bulk
  - You can perform last-minute edits and verify solutions with solvers before upload
- Added puzzle comments
  - Leave comments that are visible to all signed-in users
  - You are free to edit and delete your comments
- Fixed the auto solver not reporting solution uniqueness
- Fixed the cspuz solver not reporting solution uniqueness for underclued puzzles
- Fixed the config popup losing focus when a full-screen modal is open
- Fixed page suspense not working in Firefox

# 19/8/2025

**PREVIEW BRANCH**

- Added collections - group puzzles into a playlist for easy access
  - You are free to create, modify and delete any of your collections
  - Opening a puzzle from a collection creates a sidebar where you can quickly switch to other puzzles in the same collection
  - Every user has collections for created, loved and solved puzzles, with their contents being updated automatically
  - Following a user follows their "Created puzzles" collection
- Added profile page
- Added puzzle and collection lists in the front page
- Fixed identity association - you can now sign in to the same Logic Pad account with accounts of different emails
- Improved grid resize algorithm for mobile and tablet screens

# 15/8/2025

**PREVIEW BRANCH**

- Fixed route protection redirecting incorrectly
- Added "any" option to search filters and optimized search UI
- Added search UI to my-stuff page
- Added a section in settings to manage account providers

# 14/8/2025

**PREVIEW BRANCH**

- You can now change your username in /settings
- Certain pages now redirect to home page when you are not online/signed in
- Fixed config popup not working for symbols
- Fixed hotkeys not working in certain keyboard layouts
- Implemented online perfection mode
- Fixed difficulty ratings interfering with each other
- Improved grid resizing logic to account for wrap-around grids

# 13/8/2025

**PREVIEW BRANCH**

- First preview for Logic Pad online mode
  - Sign in/sign up with your Google or Discord account
  - Upload and publish your puzzles
  - Solve online puzzles and give them loves and ratings
  - Search for online puzzles with queries and filters
  - Access your own puzzles in the "My Stuff" page
- Updated multiple core dependencies
- Reworked page loading flow and suspension
- Added an option to use sans-serif font
- Added an option to disable all online features

# 30/7/2025

- Fixed incorrect validation on galaxy symbols (solvers are unaffected)

# 8/6/2025

- Fixed playback line position in music grids where the playback track and the grid have different BPM
- Fixed out-of-bounds grid zones
- Fixed music grid track defaulting to a gray grid

# 30/4/2025

- Fixed myopia not being satisfied when placed near the edge of the grid
- Fixed ban pattern rule missing some checks for reverse reflective grids

# 14/4/2025

- Excluded the wrap-around rule from the auto solver's optimization

# 30/3/2025

- Updated the cspuz solver to fix lotuses/galaxies

# 28/3/2025

- Optimized the auto solver by combining results from multiple solvers when unsupported instructions are present
- Added "All light/dark area must contain this pattern" rule

# 21/3/2025

- Removed top nav bar shadow

# 20/3/2025

- Improved the accuracy of drag-and-drop animations in the editor's rule list
- Color adjustments
  - Light theme no longer has a dark background
  - Dark theme now has a slightly brighter background to contrast with dark tiles
  - Aqua theme now uses white text for contrast

# 12/3/2025

- Added the auto solver - automatically selects the fastest solver based on environment and grid support
- Added support for uniqueness checking in the cspuz solver
- Out-of-bounds grid connections/zones are no longer allowed

# 11/3/2025

- Added the cspuz solver - WebAssembly based CSP reduction solver with incredible performance
- Fixed lotuses between two tiles missing certain checks

# 8/3/2025

- Added support for reversed reflection in the wrap-around rule
- Small solver improvements
  - All solvers now report "No solution" if no tiles are filled in an underclued grid
  - Display author name of solvers
  - Internal API change to the cancellation mechanism

# 28/2/2025

- Fixed browser zoom and device pixel ratio affecting the generated puzzle image

# 27/2/2025

- Fixed minesweeper and focus numbers counting tiles twice in reversed wrap-around grids
- Capitalized Minesweeper Numbers for consistency
- Fixed a crash due to the tile count overlay activating while the grid is rendering

# 26/2/2025

- Cut the number of samples loaded by music grids to reduce memory usage
- Improved dragging behavior: tiles of opposite color will only be replaced if you stared dragging from a tile of opposite color

# 25/2/2025

- Added **Focus Numbers**, supported by backtrack and universal solvers
- Non-standard tools are now hidden behind a toggle by default
- Redesigned the minesweeper symbol
- Moved the zone tool to last and reworked keybinds

# 24/2/2025

- Rework site settings to mostly be applied instantly
  - **Note: all site settings are reset**
- Moved wrap-around visualization toggle to site settings

# 23/2/2025

- Added a toggle to turn off wrap-around visualizations
- Fixed viewpoints in wrap-around grids
- Fixed padding in a grid-only puzzle image
- Fixed the code editor being cut off on large screens

# 22/2/2025

- You can now color the semi-transparent tiles directly in wrap-around rule
- Improved the hitbox of merge and zone tools in the editor
- Fixed pattern detection, galaxies and lotuses when all edges are reverse-wrapped

# 21/2/2025

- Fixed validation of lotuses and galaxies in wrap-around grids
- Added a new option in image sharing - grid only
- Fixed wrap-around rule in 0-size grids

# 20/2/2025

- Added the wrap-around rule

# 18/2/2025

- Puzzle images now use full-sized cards if there are not a lot of instructions
- Fixed a scrolling bug in puzzle image box

# 17/2/2025

- Fixed transforms not working in puzzle image renderer
- You can now choose whether to share your current progress or a fresh render of the puzzle

# 16/2/2025

- Added a button to share puzzle screenshot in solve mode
- Fixed a bug in the universal solver causing it to miss the last tile of an underclued grid

# 15/2/2025

- Changed grid editor modals to be fullscreen for mobile-friendliness
- Fixed various z-order issues
- Fixed cell boundaries not being visible on grids with very small tile size

# 14/2/2025

- Enhanced support for smaller screens
  - Tweaked the rendering of merged given tiles to increase visibility
  - Scaled up the color toggle
  - Collapsed the left editor pane
  - Scaled down the instruction cards and added a dense layout
  - Scaled down elements of the header bar
  - Scaled down puzzle metadata
  - Added an intermediate layout designed for tablets
- Refactored solve controls so that the cancel button is in a more sensible place when looking for alternate solutions

# 13/2/2025

- Reworked the underclued solver to behave like backtrack solver but with universal rules and symbols support
- Renamed underclued solver to universal solver
- Added a button to cancel the current solve attempt
- Optimized grid data copying for the universal solver
- Changed the thumbnail grid of the lying symbols rule
- Fixed an error related to myopia being a lying symbol

# 11/2/2025

- Added the lying symbols rule

# 9/2/2025

- Fixed the backtrack solver incorrectly reporting no solution in some grids with galaxy symbols

# 8/2/2025

- Fixed underclued tile count in perfection mode

# 6/2/2025

- Sanitize patterns in "Don't make this pattern" rules to avoid removed cells

# 1/2/2025

- Hidden tiles now match tile colors against grid solution directly

# 31/1/2025

- Changed default velocity of music grid notes to 0.5
- Note velocity is now normalized by pitch by default
- You can now copy a link that displays the solution for further editing

# 30/1/2025

- You can no longer undo a grid reset in perfection mode
- Added hotkey indications for various buttons
- Fixed "copy solve path" button not working for underclued grids
- Added a button to reset solver
- Disabled fancy animations in the editor
- Drum sample volume can now be controlled with the velocity field

# 29/1/2025

- Changed how cell count per zone works
- The perfection rule now locks further input on error even if a solution is not available
- The perfection rule is now searchable in the editor
- Undo/redo hotkeys are now usable in editor modal boxes
- Fixed site update leading to blank pages in some instances
- Fixed broken images when offline
- If a solution is available, you can now amend an error in perfection mode without having to undo

# 28/1/2025

- Puzzles without a difficulty rating now display a question mark
- Added `hihat-open` note for music grids

# 27/1/2025

- Added the perfection mode in which all cell colors are final (accessible in the `/perfection` page)
- Enhanced the foresight rule to consider solve paths
- Added cell count per zone rule
- Changed zones internally to be a grid attribute

# 26/1/2025

- Added small variance in music grid playback to hopefully make chords more prominent
- Mute individual tiles when the whole music grid is playing
- Added a small fix for load errors during future deployments
- Site updates now preserve your current puzzle (but still reset the solve progress)

# 25/1/2025

- Added drum samples (kick, snare, hihat, crash, tom, rim) to music grids
- Fixed symbol colors on hidden tiles
- Added a config in the Hidden symbol to reveal location
- Added support for dual-color galaxies and lotuses

# 24/1/2025

- Added the Hidden symbol which hides other symbols until the tile is colored correctly
- Fixed a bug causing the exit confirmation setting to be ignored
- You can no longer have more than one off-by-X or foresight rules

# 23/1/2025

- Settings rework: toggles now live in a settings dialog which you can open from the quick access bar on the top right corner
- Added a setting to disable exit confirmation
- Added a setting to invert primary colors by default

# 20/1/2025

- Fixed text overflow in puzzle description

# 12/1/2025

- Fixed ban pattern rule in the backtrack solver
- Fixed dart symbol in backtrack solver

# 10/1/2025

- Fixed myopia rule in the backtrack solver
- Include the API of Logic Pad in the same repo using a monorepo setup

# 5/1/2025

- Moved the core API of Logic Pad to a separate package at https://github.com/hlysine/logic-core

# 3/1/2025

- Allow the grid to be resized by gestures/ctrl+scroll wheel

# 26/8/2024

- Fixed the theme switcher not highlighting the current theme

# 4/7/2024

- Added a toggle in myopia arrows to check diagonals
- Added a small padding between instructions

# 19/6/2024

- Reworked hotkeys again to avoid clashing with undo/reset

# 18/6/2024

- Added the ability to reorder rules
- Changed the control scheme of the merge tool to work on mobile
- Split resize tool into row and column variants
- Reworked hotkeys for tools

# 24/5/2024

- Scaffolding for backend
- Logic Pad is now accessible at <logic-pad.com>

# 22/5/2024

- Internal rework of the code generation mechanism
- All solvers now ignore rules that do not affect the solution
- Disallowed grid of negative size

# 21/5/2024

- Fixed myopia arrows not treating empty tiles appropriately
- Massive restructure of codebase to prepare for backend code
- Fixed bogus tile count when a viewpoint is on a gray tile

# 20/5/2024

- Enhanced support for Markdown in puzzle description
- Added support for `||spoilers||` which can be revealed by solving the puzzle
- You can now count gray tiles by holding `ctrl`
- Added a button to reset the site in case of bugs
- Fixed myopia arrows sometimes turning green when incomplete
- Fixed tile count overlay to support older browsers

# 19/5/2024

- Optimized site loading and enabled installation as PWA app
- Added support for Safari 16
- Fixed the backtrack solver to work with new options in symbols per area rule
- Added a new curated puzzle

# 18/5/2024

- Fixed incorrect rendering of the thumbnail grid of ban pattern rule
- Added "at least/at most" options to symbols per area rule
- Added a confirmation message when leaving the puzzle editor
- Clicking the site icon now brings you back to the front page
- Fixed front page colors in different themes
- Added more curated puzzles
- Added changelog

# 17/5/2024

- Added front page
- You can now use Markdown in puzzle description
- Improved the backtrack solver to support more rules and symbols (ALaggyDev)
- The underclued solver now reports a solution as unique if it fills the grid completely
- Added optional checkpoints in music grids
- Fixed several bugs related to music grid playback

# 16/5/2024

- Added foresight rule for optional hints
- Display all rules by default in the rule search box
- Fixed symbol colors when the underlying tile does not exist
- Added the resize tool
- Several QoL improvements in the puzzle editor
