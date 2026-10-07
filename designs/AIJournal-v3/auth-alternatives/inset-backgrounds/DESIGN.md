# Retained inset account designs

## Overview

Plain paper is selected and has been applied to the main sign-in and sign-up screens. Diagonal-light frosted glass remains as the only alternative. All other auth explorations have been removed. These files remain portable design previews; main source screens now share the approved plain-paper layout through lock.css.

## Colors and typography

Both inherit Journal's paper, rust, ink and type tokens. Form containers are fully opaque paper-2. The plain form retains soft shadows; diagonal glass retains its static reflection behind the opaque form. User-requested glass/shadow exceptions remain local to these previews.

## Layout

Both retain the padded full-height inset spread. Mobile puts the account form first and scrolls naturally. The rail remains at the left edge. Sign-up adds a Confirm password field below the original password field.

Forgot your password? and Use at least 8 characters. sit 8px below their respective password control, with the same font and line height. The previous 14px spacing was halved to 7px and rounded up to the even, existing 8px token. Browser text bounds measure the same 9px gap from the field border in both modes. The recovery control retains a 44px target.

## Components and validation

- Sign-in uses email and one password; the confirmation field is hidden, disabled and not required.
- Sign-up requires matching passwords. A missing or mismatched confirmation produces an associated inline error and focuses that field. Entered values are retained on error.
- Each password has an independent eye button with accessible visibility state.
- Switching modes retains email and clears both password values and visibility states.
- At least eight characters is the existing product requirement; confirmation does not change that rule.
- A password-length error replaces the sign-up hint in the same space. Editing the password clears the error and restores the hint; the accessible description follows the visible message.
- Preview submission and recovery remain disconnected from any account service.

## Open and verify

- [Diagonal-light glass](05-glass-diagonal-light.html)

The standalone diagonal-light preview remains editable and portable. Its former shared build/verification helpers and the merged plain-paper snapshot are historical and were archived. See [cleanup record](../../docs/CLEANUP-2026-10-07.md). Main validation uses `node scripts/verify-website-preview.mjs`; font updates use the explicit `node scripts/update-portable-fonts.mjs` build step.
