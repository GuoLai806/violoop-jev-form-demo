# Prevent the form shell from panning horizontally

Before this change the decorative circles extended the shell's horizontal
overflow area. `overflow: hidden` clipped them visually but still made the shell
a programmatically scrollable container. During real Chrome form interaction the
shell acquired scrollLeft=248.5 while the window, CSS viewport and pixel density
remained unchanged. The header and form were therefore cropped on the left.
The same symptom existed before the separate Pi screenshot fix.

The change loads one narrowly scoped rule, `.shell { overflow: clip; }`, after
the existing styles. It keeps decorative clipping but does not create a scroll
container. Normal document scrolling remains available. Question data, form
validation, choice feedback, submissions, timing and usage scripts are unchanged.
This is a website layout correction, not a CU-driver workaround or evidence that
the CU screenshot issue is fixed.

Reference: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow

Validation:

- `node --test tests/layout-stability.test.mjs` verifies stylesheet order and the
  exact scoped rule. This is a static check, not browser acceptance.
- Live acceptance uses normal Chrome and complete prompts in the real Pi TUI,
  with independent checks of shell scrollLeft and visible header/form alignment
  through the later questions and the final 30/30 result. Pending at this commit.
- Existing completed user tabs must not be reset or reloaded for acceptance.

Rollback: revert the stylesheet/link commit; the pre-change source is commit
`70e7d323b1611325470911cd94b65a27dcc32137` (local tag `layout-before-20261019`).
