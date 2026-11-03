// Choose a new password and its states (journal-website.html): each state's route (the shell's id) and its form
// section's data (system/modules/sections/auth-form), read from the screens' final markup.
export default {
 "spread": "login",
 "states": {
  "default": {
   "route": "auth-reset",
   "form": {
    "heading": "Choose a new password",
    "headingId": "login-heading",
    "copy": "Use at least 8 characters. This link works once, for 30 minutes.",
    "form": {
     "action": "00-prototype.html#auth-login-after-reset"
    },
    "fields": [
     {
      "id": "reset-base-pass",
      "label": "New password",
      "attrs": {
       "type": "password",
       "value": "",
       "required": true,
       "minlength": "8",
       "autocomplete": "new-password"
      },
      "toggle": "Show password",
      "lines": []
     }
    ],
    "submit": "Save new password"
   }
  },
  "short": {
   "route": "auth-reset-short",
   "form": {
    "heading": "Use a longer password",
    "headingId": "login-heading",
    "form": {
     "action": "00-prototype.html#auth-login-after-reset"
    },
    "fields": [
     {
      "id": "reset-short-pass",
      "label": "New password",
      "attrs": {
       "type": "password",
       "value": "",
       "required": true,
       "minlength": "8",
       "aria-invalid": "true",
       "aria-describedby": "reset-short-help"
      },
      "toggle": "Show password",
      "lines": [
       {
        "text": "Use at least 8 characters.",
        "place": "help",
        "attrs": {
         "id": "reset-short-help"
        }
       }
      ]
     }
    ],
    "submit": "Save new password"
   }
  },
  "saving": {
   "route": "auth-reset-saving",
   "form": {
    "heading": "Saving password",
    "headingId": "login-heading",
    "copy": "Saving your new password and signing out every device."
   }
  },
  "expired": {
   "route": "auth-reset-expired",
   "form": {
    "heading": "This link no longer works",
    "headingId": "login-heading",
    "copy": "This link has expired or has already been used. Ask for a new one.",
    "actions": [
     {
      "label": "Ask for a new link",
      "href": "00-prototype.html#auth-forgot",
      "grade": "solid"
     }
    ]
   }
  },
  "network": {
   "route": "auth-reset-network",
   "form": {
    "heading": "Password not changed",
    "headingId": "login-heading",
    "notice": "We could not reach the server. Your new password is still in the field; try again.",
    "form": {
     "action": "00-prototype.html#auth-login-after-reset"
    },
    "fields": [
     {
      "id": "reset-network-pass",
      "label": "New password",
      "attrs": {
       "type": "password",
       "value": "quietmorning",
       "required": true,
       "minlength": "8"
      },
      "toggle": "Show password",
      "lines": []
     }
    ],
    "submit": "Try again"
   }
  }
 }
};
