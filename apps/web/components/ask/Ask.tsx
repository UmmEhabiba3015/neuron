'use client';

import { useState } from 'react';
import { Gate } from '@/components/layout/Gate';
import { KeyBox, LiveScreen } from '@/components/layout/LiveScreen';
import { NotBuiltYet } from '@/components/ui/NotBuilt';
import { useNotBuilt } from '@/hooks/useNotBuilt';
import { useTodayDate } from '@/hooks/useTodayDate';

/*
 * Ask, from 04-ask.html: the one field for asking and searching. Asking is
 * feature 12, Ask (lib/unbuilt.ts). What is typed stays in the field and
 * goes nowhere; a press of Ask, or Enter, says so under the field.
 *
 * The comp draws the field and no button. Ask is a button here, drawn as the
 * composer's Save is, so that a person with no keyboard has a way to send.
 *
 * Nothing is drawn under the field. The comp's results, their count, the
 * note about recordings and the "Since" line are all answers to a question,
 * and no question has been answered.
 */
export function Ask() {
  return <Gate>{() => <AskField />}</Gate>;
}

function AskField() {
  const date = useTodayDate();
  const [text, setText] = useState('');
  const ask = useNotBuilt('ask');

  return (
    <LiveScreen
      current="Ask"
      title="Ask"
      aside={<KeyBox label="Day" value={date} />}
    >
      <form
        className="crow find"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          ask.press();
        }}
      >
        <input
          className="field"
          type="text"
          aria-label="Ask your journal"
          placeholder="Ask your journal"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button className="send" type="submit" {...ask.marker}>
          {ask.label}
        </button>
      </form>
      {ask.said ? (
        <main className="sheet">
          <NotBuiltYet className="auth-help state-message" />
        </main>
      ) : null}
    </LiveScreen>
  );
}
