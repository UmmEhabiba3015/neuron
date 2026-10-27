import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { entry, fakeApi } from '@/test/fake-api';
import { LiveToday } from './LiveToday';

/*
 * Today, drawn by its real components, against the API faked at `fetch`
 * (ADR-026). Keys are pressed with user-event and never with fireEvent:
 * user-event inserts the new line itself when the default was not
 * prevented, which is what a browser does, so a missing preventDefault()
 * shows here.
 */
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
}));

function touchOnlyScreen() {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) => ({ matches: true, media: query }) as MediaQueryList,
  );
}

async function openToday() {
  const user = userEvent.setup();

  render(<LiveToday />);

  const box = await screen.findByRole('textbox', { name: 'Add to today' });

  return { user, box };
}

describe('the composer on Today', () => {
  test('Enter saves the entry and leaves no new line in the box', async () => {
    const api = fakeApi({ hold: ['POST /entries'] });
    const { user, box } = await openToday();

    await user.type(box, 'A quiet morning');
    await user.keyboard('{Enter}');

    expect(box).toHaveProperty('value', 'A quiet morning');
    expect(api.sent.filter((each) => each.path === '/entries')).toEqual([
      { method: 'POST', path: '/entries', body: { content: 'A quiet morning' } },
    ]);
  });

  test('Shift with Enter adds a line and does not save', async () => {
    const api = fakeApi();
    const { user, box } = await openToday();

    await user.type(box, 'A quiet morning');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(box).toHaveProperty('value', 'A quiet morning\n');
    expect(api.calls()).not.toContain('POST /entries');
  });

  test('on a touch-only screen Enter adds a line and does not save', async () => {
    touchOnlyScreen();
    const api = fakeApi();
    const { user, box } = await openToday();

    await user.type(box, 'A quiet morning');
    await user.keyboard('{Enter}');

    expect(box).toHaveProperty('value', 'A quiet morning\n');
    expect(api.calls()).not.toContain('POST /entries');
  });
});

describe('the editor of an entry', () => {
  test('Enter saves the change and leaves no new line in the box', async () => {
    const api = fakeApi({
      entries: [entry('e1', 'First words')],
      hold: ['PATCH /entries/e1'],
    });
    const { user } = await openToday();

    await user.click(screen.getByRole('button', { name: 'Edit entry' }));

    const box = screen.getByRole('textbox', { name: 'Entry text' });

    await user.type(box, ', and more');
    await user.keyboard('{Enter}');

    expect(box).toHaveProperty('value', 'First words, and more');
    expect(api.sent.filter((each) => each.method === 'PATCH')).toEqual([
      {
        method: 'PATCH',
        path: '/entries/e1',
        body: { content: 'First words, and more' },
      },
    ]);
  });
});

describe('an unbuilt control', () => {
  test('a press says it is not built yet and sends no request', async () => {
    const api = fakeApi();
    const { user } = await openToday();

    await waitFor(() => expect(api.calls()).toContain('GET /days/today'));
    const before = api.calls().length;

    await user.click(
      screen.getByRole('button', { name: 'Keep this out of memory' }),
    );

    expect(screen.getByRole('status')).toHaveProperty(
      'textContent',
      'This is not built yet.',
    );
    expect(api.calls()).toHaveLength(before);
  });
});
