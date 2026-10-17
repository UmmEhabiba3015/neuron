'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PasswordField } from '@/components/auth/AuthForm';
import { Gate } from '@/components/layout/Gate';
import { PushedScreen } from '@/components/layout/LiveScreen';
import { session } from '@/lib/api/client';
import type { ReceivedFile } from '@/lib/api/session';
import {
  COUNT_PATHS,
  DELETE_QUESTION,
  DELETE_WARNING,
  EXPORT_ROW,
  NOTHING_TO_EXPORT,
  SIGN_IN_AFTER_DELETE,
  countsFrom,
  countsLine,
  exportOutcome,
  exportStart,
  notDeletedSentence,
  type Counts,
} from '@/lib/your-data';

/*
 * Your data, from #settings-data in 00-prototype.html: the export, with its
 * counts, and deleting the account (docs/features.md, Refs 36, 37 and 8).
 * What each answer means is decided in lib/your-data.ts.
 *
 * The export waits for the API (ADR-021), and says it is being prepared
 * meanwhile. Then the quiet Ready state offers the same file again, in case
 * the browser did not start the download.
 */
export function YourData() {
  return <Gate>{() => <YourDataRows />}</Gate>;
}

type Exporting =
  | { status: 'idle' }
  | { status: 'nothing' }
  | { status: 'preparing' }
  | { status: 'ready'; url: string; filename: string }
  | { status: 'notExported'; why: 'unreachable' | 'failed' };

const NOT_EXPORTED: Record<'unreachable' | 'failed', string> = {
  unreachable:
    'We could not reach the server. Nothing was exported. Try again.',
  failed: 'Something went wrong on our side. Nothing was exported. Try again.',
};

/*
 * Saving is the browser's: a link to the file, with the name to save it
 * under, pressed once. The same link is drawn in the Ready state.
 */
function save(url: string, filename: string): void {
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
}

function YourDataRows() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [exporting, setExporting] = useState<Exporting>({ status: 'idle' });
  const [deleting, setDeleting] = useState(false);
  const exportInFlight = useRef(false);
  const exportRow = useRef<HTMLButtonElement>(null);
  const deleteRow = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let current = true;

    void Promise.all([
      session.request<{ count: number }>(COUNT_PATHS.entries),
      session.request<{ count: number }>(COUNT_PATHS.recordings),
    ]).then(([entries, recordings]) => {
      if (current) {
        setCounts(countsFrom(entries, recordings));
      }
    });

    return () => {
      current = false;
    };
  }, []);

  /* The file is let go when the Ready state goes, or the page does. */
  const readyUrl = exporting.status === 'ready' ? exporting.url : null;

  useEffect(() => {
    if (readyUrl === null) {
      return;
    }

    return () => URL.revokeObjectURL(readyUrl);
  }, [readyUrl]);

  async function startExport() {
    if (exportInFlight.current) {
      return;
    }

    if (exportStart(counts) === 'nothing') {
      setExporting({ status: 'nothing' });
      return;
    }

    exportInFlight.current = true;
    setExporting({ status: 'preparing' });

    const outcome = exportOutcome(
      await session.request<ReceivedFile>('/export', { receive: 'file' }),
    );

    exportInFlight.current = false;

    /* The session is over, and Gate sends the person to sign in. */
    if (outcome.kind === 'ended') {
      return;
    }

    if (outcome.kind !== 'ready') {
      setExporting({ status: 'notExported', why: outcome.kind });
      return;
    }

    const url = URL.createObjectURL(outcome.blob);

    save(url, outcome.filename);
    setExporting({ status: 'ready', url, filename: outcome.filename });
  }

  return (
    <PushedScreen back={{ href: '/you', label: 'You' }} title="Your data">
      <main className="sheet">
        <h2 className="shead">Take it out</h2>
        <button
          className="srowlink"
          type="button"
          ref={exportRow}
          onClick={() => void startExport()}
        >
          <span className="lab">
            Export everything
            <span className="why">{EXPORT_ROW}</span>
          </span>
          {counts ? <span className="val">{countsLine(counts)}</span> : null}
        </button>
        <ExportState exporting={exporting} />
        <h2 className="shead">End it</h2>
        <button
          className="srowlink"
          type="button"
          ref={deleteRow}
          onClick={() => setDeleting(true)}
        >
          <span className="lab">
            Delete account
            <span className="why">
              Delete this account and everything in it. Export is directly
              above this for a reason.
            </span>
          </span>
          <span className="val">Permanent</span>
        </button>
        {deleting ? (
          <DeleteDialog
            /*
             * Focus goes back to the row on the next frame, once the dialog
             * has left the page: moved while it is still open, the browser
             * drops it on the body when the dialog goes.
             */
            onClose={() => {
              setDeleting(false);
              requestAnimationFrame(() => deleteRow.current?.focus());
            }}
            onExportInstead={() => {
              setDeleting(false);
              requestAnimationFrame(() => exportRow.current?.focus());
              void startExport();
            }}
          />
        ) : null}
      </main>
    </PushedScreen>
  );
}

function ExportState({ exporting }: { exporting: Exporting }) {
  switch (exporting.status) {
    case 'idle':
      return null;
    case 'nothing':
      return (
        <p className="auth-help state-message" role="status">
          {NOTHING_TO_EXPORT}
        </p>
      );
    case 'preparing':
      return (
        <p className="auth-help state-message" role="status">
          Preparing your export.
        </p>
      );
    case 'ready':
      return (
        <div className="state-message">
          <div className="notice" role="status">
            Your export is ready. If the download did not start,{' '}
            <a href={exporting.url} download={exporting.filename}>
              download it again
            </a>
            .
          </div>
        </div>
      );
    case 'notExported':
      return (
        <div className="state-message">
          <div className="notice" role="alert">
            {NOT_EXPORTED[exporting.why]}
          </div>
        </div>
      );
  }
}

type DeleteStep =
  | { status: 'asking' }
  | { status: 'deleting' }
  | { status: 'notDeleted'; sentence: string };

/*
 * The one blocking dialog in the product (docs/features.md, Ref 8), from
 * #account-delete-confirm in journal-prototype.html. Its safe choice,
 * Export instead, has the focus when it opens. Escape, and Keep my account,
 * close it with nothing deleted.
 *
 * It is the browser's own <dialog>, opened as a modal, so the page behind
 * it can be neither read nor reached while it is open.
 *
 * The press of Delete account waits for the API (ADR-021). On success the
 * session says the account was deleted, and Gate sends the person to sign
 * in, which says so.
 */
function DeleteDialog({
  onClose,
  onExportInstead,
}: {
  onClose: () => void;
  onExportInstead: () => void;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const exportInstead = useRef<HTMLButtonElement>(null);
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<DeleteStep>({ status: 'asking' });
  const inFlight = useRef(false);

  useEffect(() => {
    const element = dialog.current;

    if (element && !element.open) {
      element.showModal();
    }

    exportInstead.current?.focus();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    setStep({ status: 'deleting' });

    const outcome = await session.deleteAccount(password);

    inFlight.current = false;

    if (outcome === 'deleted') {
      router.replace(SIGN_IN_AFTER_DELETE);
      return;
    }

    const sentence = notDeletedSentence(outcome);

    if (sentence === null) {
      return;
    }

    setStep({ status: 'notDeleted', sentence });

    if (outcome === 'wrongPassword') {
      document.getElementById('delete-password')?.focus();
    }
  }

  return (
    <dialog
      className="dialog"
      ref={dialog}
      aria-labelledby="delete-account-heading"
      aria-describedby="delete-account-warning"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="card">
        <h3 id="delete-account-heading">{DELETE_QUESTION}</h3>
        <p id="delete-account-warning">{DELETE_WARNING}</p>
        <form className="delete-form" noValidate onSubmit={submit}>
          <PasswordField
            id="delete-password"
            label="Password"
            what="password"
            autoComplete="current-password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              if (step.status === 'notDeleted') {
                setStep({ status: 'asking' });
              }
            }}
          />
          {step.status === 'notDeleted' ? (
            <p className="auth-help state-message" role="alert">
              {step.sentence}
            </p>
          ) : null}
          {step.status === 'deleting' ? (
            <p className="auth-help state-message" role="status">
              Deleting your account.
            </p>
          ) : null}
          <div className="card-foot">
            <button
              className="btn solid"
              type="button"
              ref={exportInstead}
              onClick={onExportInstead}
            >
              Export instead
            </button>
            <button className="btn keyline" type="submit">
              Delete account
            </button>
            <button className="btn quiet" type="button" onClick={onClose}>
              Keep my account
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
