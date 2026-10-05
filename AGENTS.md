# Game design requirements

- Build and maintain this as a smartphone game. The user explicitly rejects website-style layouts for their games.
- The playable board, progress, and core controls must fit in one viewport without scrolling. Use the available height as well as width; account for mobile browser bars and safe areas.
- Do not add introductory hero sections, sidebars, marketing copy, or footers to the game screen.
- Put rules, difficulty, and level selection in overlays opened only when needed.
- Keep touch targets comfortable and support swipe controls. Preserve desktop keyboard operation.
- Before publishing layout changes, inspect small portrait (320×568 and 320×480), typical portrait (390×844), and landscape (844×390) viewports. Check actual board/button bounds, not just hidden overflow.
- Keep the GitHub Pages deployment and the existing puzzle rules working.
