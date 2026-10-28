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
export const FOOTER_H = 90; // rule to bottom of page, so the rule lands on R3's y 1510
// and the footer mark's centre meets the carousel controls on the reference line
// The footer's iC+P mark: its height (in u, like its width) and how far it
// sits above the footer rule (in v). Pages with text in the bottom-left corner
// keep clear of it.
export const FOOTER_MARK_H = 61;
export const FOOTER_MARK_LIFT = 51;
// Where the text in a full-height side panel stops: above the footer's iC+P
// mark, which sits in the panel's bottom-left corner. Below the nav is
// PANEL_TEXT_TOP (design px from the top).
export const PANEL_TEXT_TOP = NAV_TOP + NAV_BAR_H + 34;
export const PANEL_TEXT_BOTTOM = `calc(${v(FOOTER_H + FOOTER_MARK_LIFT + 30)} + ${u(FOOTER_MARK_H)})`;
// The foot of a panel's text fades while there is more to scroll to, so the
// last visible line does not read as the end of the text (useMoreBelow).
export const FADE_FOOT = 'linear-gradient(to bottom, #000 calc(100% - 56px), transparent)';

// Media queries shared by CSS (index.css / tailwind `tall:`) and JS.
export const PORTRAIT_QUERY = '(orientation: portrait) and (max-width: 1100px)';
// Phones get MobileBlock: a window narrower than any tablet, or a touch device
// whose screen is phone-sized — its shorter side under 600 CSS px, Android's
// own line between phone and tablet. The line was 700px, which also caught
// tablets held upright (a Xiaomi Pad is about 686px wide that way round). And
// it is the screen that is measured, not the window: a phone held sideways
// was caught by "short and wide", which a tablet's window also becomes when
// its keyboard opens, swapping the enquiry form for the block mid-typing.
export const MOBILE_QUERY = '(max-width: 599px)';
export const PHONE_SCREEN = 600;
// Some browsers report the window as the screen (Brave, and Firefox's
// fingerprinting protection), which makes a tablet showing its toolbar look
// phone-sized. No phone shows a window this big — even the largest are under
// about 400px tall held sideways — so a window this size is a tablet whatever
// the screen says.
const TABLET_WINDOW = { short: 460, long: 950 };
export const isPhoneScreen = () => {
  if (!window.matchMedia('(pointer: coarse)').matches) return false;
  const short = Math.min(window.innerWidth, window.innerHeight);
  const long = Math.max(window.innerWidth, window.innerHeight);
  if (short >= TABLET_WINDOW.short && long >= TABLET_WINDOW.long) return false;
  return Math.min(window.screen.width, window.screen.height) < PHONE_SCREEN;
};
export const NO_HOVER_QUERY = '(hover: none)';
