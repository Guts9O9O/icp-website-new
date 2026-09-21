// The R3 design is drawn on a 2560 x 1600 artboard. `--u` (set in index.css)
// is one design pixel at the current viewport width, so `u(20)` is exactly
// 20px on a 2560-wide screen and scales down proportionally on smaller ones.
export const u = (n) => `calc(${n} * var(--u))`;

// Vertical counterpart: one design pixel of the 1600-tall artboard at the current
// viewport height. On 16:10 screens u === v; on 16:9 screens v is ~10% smaller so
// the composition still fits between the nav and the footer.
export const v = (n) => `calc(${n} * var(--v))`;

// Font sizes scale the same way but never drop below a readable floor.
export const fs = (n, min = 12) => `max(${min}px, calc(${n} * var(--u)))`;

// Layout constants from R3, in design px.
export const EDGE_BAR = 14.5; // full-height side bars
export const NAV_TOP = 100; // top of the nav row
export const NAV_BAR_H = 56.65; // height of the small nav bars
export const FOOTER_H = 100; // rule to bottom of page

// Media queries shared by CSS (index.css / tailwind `tall:`) and JS.
export const PORTRAIT_QUERY = '(orientation: portrait) and (max-width: 1100px)';
// Phones: narrow screens, or touch devices held sideways (short and wide).
export const MOBILE_QUERY = '(max-width: 699px), ((pointer: coarse) and (max-height: 500px))';
export const NO_HOVER_QUERY = '(hover: none)';
