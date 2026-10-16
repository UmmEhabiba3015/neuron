'use client';

import { Fragment, useEffect, useState, useSyncExternalStore } from 'react';
import { session } from '@/lib/api/client';
import {
  DEVICE_NOT_SIGNED_OUT,
  createDevices,
  deviceLine,
} from '@/lib/devices';

/*
 * Signed-in devices, on Account (#account-devices in 17-account-data.html).
 * What each answer means is decided in lib/devices.ts; this draws it.
 *
 * This device is a row with nothing to press: "Sign out of this device",
 * below the list, is how it is signed out. Every other device's row is a
 * button, as the comp draws it, and its value says what a press does. While
 * it is asked, and if it fails, a sentence under the row says so.
 */
export function Devices({ timeZone }: { timeZone: string }) {
  const [devices] = useState(() => createDevices({ request: session.request }));
  const { view, asking, signingOut, notSignedOut } = useSyncExternalStore(
    devices.subscribe,
    devices.getState,
    devices.getState,
  );

  useEffect(() => {
    void devices.open();
  }, [devices]);

  return (
    <>
      <h3 className="shead">Signed-in devices</h3>

      {view.status === 'opening' ? (
        <p className="auth-help" role="status">
          Loading your devices.
        </p>
      ) : null}

      {view.status === 'unreachable' || view.status === 'failed' ? (
        <>
          <div className="notice" role="alert">
            {view.status === 'unreachable'
              ? 'We could not reach the server. Try loading your devices again.'
              : 'Something went wrong on our side. Try loading your devices again.'}
            {view.asked > 1 ? ` Asked ${view.asked} times.` : null}
          </div>
          {asking ? (
            <p className="auth-help" role="status">
              Asking again.
            </p>
          ) : null}
          <div className="auth-actions">
            <button
              className="btn quiet"
              type="button"
              onClick={() => void devices.open()}
            >
              Try again
            </button>
          </div>
        </>
      ) : null}

      {view.status === 'open'
        ? view.devices.map((device) =>
            device.current ? (
              <div className="srowlink" key={device.id}>
                <span className="lab">
                  {device.device}
                  <span className="why">{deviceLine(device, timeZone)}</span>
                </span>
              </div>
            ) : (
              <Fragment key={device.id}>
                <button
                  className="srowlink"
                  type="button"
                  onClick={() => void devices.signOut(device.id)}
                >
                  <span className="lab">
                    {device.device}
                    <span className="why">{deviceLine(device, timeZone)}</span>
                  </span>
                  <span className="val">Sign out</span>
                </button>
                {signingOut.includes(device.id) ? (
                  <p className="auth-help" role="status">
                    Signing out that device.
                  </p>
                ) : notSignedOut?.id === device.id ? (
                  <div className="notice" role="alert">
                    {DEVICE_NOT_SIGNED_OUT[notSignedOut.why]}
                  </div>
                ) : null}
              </Fragment>
            ),
          )
        : null}
    </>
  );
}
