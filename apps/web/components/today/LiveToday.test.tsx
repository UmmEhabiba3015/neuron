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
      {
        method: 'POST',
        path: '/entries',
        body: { content: 'A quiet morning', keptOutOfMemory: false },
      },
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

describe('keep out of memory', () => {
  test('the composer`s tick is sent with the entry, and is turned off once it is saved', async () => {
    const api = fakeApi();
    const { user, box } = await openToday();
    const tick = screen.getByRole('button', { name: 'Keep this out of memory' });

    expect(tick.getAttribute('aria-pressed')).toBe('false');
    await user.click(tick);
    expect(tick.getAttribute('aria-pressed')).toBe('true');

    await user.type(box, 'Only for me');
    await user.click(screen.getByRole('button', { name: 'Save entry' }));

    expect(api.sent.filter((each) => each.method === 'POST' && each.path === '/entries')).toEqual([
      {
        method: 'POST',
        path: '/entries',
        body: { content: 'Only for me', keptOutOfMemory: true },
      },
    ]);
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Keep this out of memory' })
          .getAttribute('aria-pressed'),
      ).toBe('false'),
    );
  });

  test('an entry kept out asks first, waits for the API, and is then in memory', async () => {
    const api = fakeApi({
      entries: [{ ...entry('e1', 'Private words'), keptOutOfMemory: true }],
    });
    const { user } = await openToday();

    const trigger = await screen.findByLabelText(
      'Entry memory settings: kept out of memory',
    );
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Use in memory' }));

    expect(
      screen.getByText('Use this entry in memory? This cannot be undone.'),
    ).toBeTruthy();
    expect(api.calls()).not.toContain('PUT /entries/e1/memory');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: /Keep it out/ }),
    );

    await user.click(screen.getByRole('button', { name: /^Use in memory/ }));

    await screen.findByLabelText('Entry memory settings: in memory');
    expect(api.calls()).toContain('PUT /entries/e1/memory');
    expect(screen.getByText('This entry is in memory now.')).toBeTruthy();
    expect(screen.getByText('This entry is in memory.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Use in memory' })).toBeNull();
  });
});
