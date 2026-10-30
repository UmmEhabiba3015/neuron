// error: <Error platform state /> in the developers' code. The page writes no markup of its own: the generic
// state page (system/content/state-page.mjs) composes it from this state's data. States: not-found,
// server-error. Platform rule: the state page's (desktop's title block).
import data from './data.mjs';
import { statePage } from '../../../content/state-page.mjs';

export default function render({ platform = 'mobile', state = 'not-found', context = 'screen' } = {}, slots, kit) {
  return statePage(data[state] || data['not-found'], platform, kit, context);
}
