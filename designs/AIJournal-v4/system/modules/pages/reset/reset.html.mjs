// reset: <Reset platform state /> in the developers' code. The page writes no markup of its own: the
// shared auth spread (system/content/auth-spread.mjs) composes the masthead, the auth section and its form
// section from this page's state. No platform rule: the spread is the same markup on every platform.
import data from './data.mjs';
import { authSpread, spreads } from '../../../content/auth-spread.mjs';

export default function render({ state = 'default' } = {}, slots, kit) {
  const s = data.states[state] || data.states.default;
  return authSpread(spreads[data.spread], s.form, s.route, kit);
}
