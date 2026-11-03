// Reset your password and its states (journal-website.html): each state's route (the shell's id) and its form
// section's data (system/modules/sections/auth-form), read from the screens' final markup.
export default {
 "spread": "login",
 "states": {
  "default": {
   "route": "auth-forgot",
   "form": {
    "heading": "Reset your password",
    "headingId": "login-heading",
    "copy": "Enter your email address. We will send a link you can use to choose a new password.",
    "form": {
     "action": "00-prototype.html#auth-forgot-sent"
    },
    "fields": [
     {
      "id": "fo-base-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "value": "",
       "required": true,
       "autocomplete": "email"
      },
      "lines": []
     }
    ],
    "submit": "Send reset link",
    "actions": [
     {
      "label": "Back to sign in",
      "href": "00-prototype.html#auth-login",
      "grade": "quiet"
     }
    ]
   }
  },
  "invalid": {
   "route": "auth-forgot-invalid",
   "form": {
    "heading": "Enter an email address",
    "headingId": "login-heading",
    "form": {
     "action": "00-prototype.html#auth-forgot-sent"
    },
    "fields": [
     {
      "id": "fo-invalid-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "value": "not-an-email",
       "required": true,
       "aria-invalid": "true",
       "aria-describedby": "fo-invalid-help"
      },
      "lines": [
       {
        "text": "Enter an email address.",
        "place": "help",
        "attrs": {
         "id": "fo-invalid-help"
        }
       }
      ]
     }
    ],
    "submit": "Send reset link",
    "actions": [
     {
      "label": "Back to sign in",
      "href": "00-prototype.html#auth-login",
      "grade": "quiet"
     }
    ]
   }
  },
  "sending": {
   "route": "auth-forgot-sending",
   "form": {
    "heading": "Sending the link",
    "headingId": "login-heading",
    "copy": "Sending your request."
   }
  },
  "sent": {
   "route": "auth-forgot-sent",
   "form": {
    "heading": "Check your email",
    "headingId": "login-heading",
    "notice": "If an account exists for mubeen@example.com, a reset link has been sent. It works for 30 minutes and can be used once.",
    "actions": [
     {
      "label": "Use a different address",
      "href": "00-prototype.html#auth-forgot",
      "grade": "quiet"
     },
     {
      "label": "Back to sign in",
      "href": "00-prototype.html#auth-login",
      "grade": "quiet"
     }
    ]
   }
  },
  "network": {
   "route": "auth-forgot-network",
   "form": {
    "heading": "Link not sent",
    "headingId": "login-heading",
    "notice": "We could not reach the server, so the request did not go through.",
    "form": {
     "action": "00-prototype.html#auth-forgot-sent"
    },
    "fields": [
     {
      "id": "fo-network-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "value": "mubeen@example.com",
       "required": true
      },
      "lines": []
     }
    ],
    "submit": "Try again"
   }
  }
 }
};
