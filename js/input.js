// Keyboard input: held state + edge-triggered "pressed" lookups.
const held = new Set();
const pressedSet = new Set();

const BLOCK_DEFAULT = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter',
]);

addEventListener('keydown', (e) => {
  if (BLOCK_DEFAULT.has(e.code)) e.preventDefault();
  if (!held.has(e.code)) pressedSet.add(e.code);
  held.add(e.code);
});

addEventListener('keyup', (e) => held.delete(e.code));
addEventListener('blur', () => held.clear());

const Input = {
  isDown: (code) => held.has(code),
  pressed: (code) => pressedSet.has(code),
  anyPressed: () => pressedSet.size > 0,
  // virtual keys from touch controls (same edge-trigger semantics as keyboard)
  press(code) {
    if (!held.has(code)) pressedSet.add(code);
    held.add(code);
  },
  release(code) { held.delete(code); },
  // treat a mouse click/tap on the canvas as Enter
  touchConfirm() {
    if (!held.has('Enter')) pressedSet.add('Enter');
    held.add('Enter');
    setTimeout(() => held.delete('Enter'), 60);
  },
  endFrame() {
    pressedSet.clear();
  },
};

export default Input;
