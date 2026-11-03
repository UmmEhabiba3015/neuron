// Create an account and its states (journal-website.html): each state's route (the shell's id) and its form
// section's data (system/modules/sections/auth-form), read from the screens' final markup.
export default {
 "spread": "register",
 "states": {
  "default": {
   "route": "auth-register",
   "form": {
    "heading": "Create an account",
    "headingId": "register-heading",
    "copy": "Create an account to begin your private journal.",
    "copyTyped": true,
    "form": {
     "action": "00-prototype.html#today-first",
     "name": "register",
     "novalidate": true
    },
    "fields": [
     {
      "id": "register-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "autocomplete": "email",
       "inputmode": "email",
       "required": true,
       "aria-describedby": "register-email-error"
      },
      "auth": "email",
      "lines": [
       {
        "text": "",
        "place": "help note",
        "attrs": {
         "id": "register-email-error",
         "hidden": true
        },
        "data": {
         "field-error": true
        }
       }
      ]
     },
     {
      "id": "register-password",
      "label": "Password",
      "attrs": {
       "type": "password",
       "autocomplete": "new-password",
       "required": true,
       "minlength": "8",
       "aria-describedby": "register-password-help"
      },
      "auth": "password",
      "toggle": "Show password",
      "lines": [
       {
        "text": "Use at least 8 characters.",
        "place": "help note",
        "attrs": {
         "id": "register-password-help"
        },
        "data": {
         "password-hint": true
        }
       },
       {
        "text": "",
        "place": "help note",
        "attrs": {
         "id": "register-password-error",
         "hidden": true
        },
        "data": {
         "field-error": true
        }
       }
      ]
     },
     {
      "id": "register-confirm-password",
      "label": "Confirm password",
      "attrs": {
       "type": "password",
       "autocomplete": "new-password",
       "required": true,
       "minlength": "8",
       "aria-describedby": "register-confirm-password-error"
      },
      "auth": "confirmation",
      "toggle": "Show confirmed password",
      "lines": [
       {
        "text": "",
        "place": "help note",
        "attrs": {
         "id": "register-confirm-password-error",
         "hidden": true
        },
        "data": {
         "field-error": true
        }
       }
      ]
     }
    ],
    "submit": "Create account",
    "actions": [
     {
      "text": "Already have an account?"
     },
     {
      "label": "Sign in",
      "href": "00-prototype.html#auth-login",
      "grade": "quiet"
     }
    ],
    "preview": [
     {
      "label": "Email already in use",
      "href": "00-prototype.html#auth-register-error"
     },
     {
      "label": "Creating account",
      "href": "00-prototype.html#auth-register-creating"
     }
    ]
   }
  },
  "error": {
   "route": "auth-register-error",
   "form": {
    "heading": "Create an account",
    "headingId": "register-heading",
    "notice": "There is already an account with this email.",
    "form": {
     "action": "00-prototype.html#today-first"
    },
    "fields": [
     {
      "id": "re-error-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "value": "mubeen@example.com",
       "required": true
      },
      "lines": []
     },
     {
      "id": "re-error-pass",
      "label": "Password",
      "attrs": {
       "type": "password",
       "value": "",
       "required": true,
       "minlength": "8"
      },
      "toggle": "Show password",
      "lines": [
       {
        "text": "Use at least 8 characters.",
        "place": "help note"
       }
      ]
     },
     {
      "id": "auth-register-error-confirm-password",
      "label": "Confirm password",
      "attrs": {
       "type": "password",
       "value": "",
       "required": true,
       "minlength": "8",
       "autocomplete": "new-password"
      },
      "toggle": "Show confirmed password",
      "lines": []
     }
    ],
    "submit": "Create account",
    "actions": [
     {
      "label": "Sign in",
      "href": "00-prototype.html#auth-login",
      "grade": "quiet"
     },
     {
      "label": "Reset your password",
      "href": "00-prototype.html#auth-forgot",
      "grade": "quiet"
     }
    ]
   }
  },
  "invalid": {
   "route": "auth-register-invalid",
   "form": {
    "heading": "Create an account",
    "headingId": "register-heading",
    "form": {
     "action": "00-prototype.html#today-first"
    },
    "fields": [
     {
      "id": "re-invalid-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "value": "not-an-email",
       "required": true,
       "aria-invalid": "true",
       "aria-describedby": "re-invalid-help"
      },
      "lines": [
       {
        "text": "Enter an email address.",
        "place": "help",
        "attrs": {
         "id": "re-invalid-help"
        }
       }
      ]
     },
     {
      "id": "re-invalid-pass",
      "label": "Password",
      "attrs": {
       "type": "password",
       "value": "",
       "required": true,
       "minlength": "8"
      },
      "toggle": "Show password",
      "lines": [
       {
        "text": "Use at least 8 characters.",
        "place": "help note"
       }
      ]
     },
     {
      "id": "auth-register-invalid-confirm-password",
      "label": "Confirm password",
      "attrs": {
       "type": "password",
       "value": "",
       "required": true,
       "minlength": "8",
       "autocomplete": "new-password"
      },
      "toggle": "Show confirmed password",
      "lines": []
     }
    ],
    "submit": "Create account",
    "actions": [
     {
      "text": "Already have an account?"
     },
     {
      "label": "Sign in",
      "href": "00-prototype.html#auth-login",
      "grade": "quiet"
     }
    ]
   }
  },
  "short": {
   "route": "auth-register-short",
   "form": {
    "heading": "Create an account",
    "headingId": "register-heading",
    "form": {
     "action": "00-prototype.html#today-first"
    },
    "fields": [
     {
      "id": "re-short-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "value": "mubeen@example.com",
       "required": true
      },
      "lines": []
     },
     {
      "id": "re-short-pass",
      "label": "Password",
      "attrs": {
       "type": "password",
       "value": "",
       "required": true,
       "minlength": "8",
       "aria-invalid": "true",
       "aria-describedby": "re-short-help"
      },
      "toggle": "Show password",
      "lines": [
       {
        "text": "Enter a password with at least 8 characters.",
        "place": "help",
        "attrs": {
         "id": "re-short-help"
        }
       }
      ]
     },
     {
      "id": "auth-register-short-confirm-password",
      "label": "Confirm password",
      "attrs": {
       "type": "password",
       "value": "",
       "required": true,
       "minlength": "8",
       "autocomplete": "new-password"
      },
      "toggle": "Show confirmed password",
      "lines": []
     }
    ],
    "submit": "Create account",
    "actions": [
     {
      "text": "Already have an account?"
     },
     {
      "label": "Sign in",
      "href": "00-prototype.html#auth-login",
      "grade": "quiet"
     }
    ]
   }
  },
  "creating": {
   "route": "auth-register-creating",
   "form": {
    "heading": "Create an account",
    "headingId": "register-heading",
    "copy": "Creating your account. You will open on Today.",
    "form": {
     "action": "00-prototype.html#today-first",
     "novalidate": true
    },
    "fields": [
     {
      "id": "register-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "autocomplete": "email",
       "inputmode": "email",
       "required": true,
       "aria-describedby": "register-email-error"
      },
      "auth": "email",
      "lines": [
       {
        "text": "",
        "place": "help note",
        "attrs": {
         "id": "register-email-error",
         "hidden": true
        },
        "data": {
         "field-error": true
        }
       }
      ]
     },
     {
      "id": "register-password",
      "label": "Password",
      "attrs": {
       "type": "password",
       "autocomplete": "new-password",
       "required": true,
       "minlength": "8",
       "aria-describedby": "register-password-help"
      },
      "auth": "password",
      "toggle": "Show password",
      "lines": [
       {
        "text": "Use at least 8 characters.",
        "place": "help note",
        "attrs": {
         "id": "register-password-help"
        },
        "data": {
         "password-hint": true
        }
       },
       {
        "text": "",
        "place": "help note",
        "attrs": {
         "id": "register-password-error",
         "hidden": true
        },
        "data": {
         "field-error": true
        }
       }
      ]
     },
     {
      "id": "register-confirm-password",
      "label": "Confirm password",
      "attrs": {
       "type": "password",
       "autocomplete": "new-password",
       "required": true,
       "minlength": "8",
       "aria-describedby": "register-confirm-password-error"
      },
      "auth": "confirmation",
      "toggle": "Show confirmed password",
      "lines": [
       {
        "text": "",
        "place": "help note",
        "attrs": {
         "id": "register-confirm-password-error",
         "hidden": true
        },
        "data": {
         "field-error": true
        }
       }
      ]
     }
    ],
    "submit": "Create account",
    "actions": [
     {
      "text": "Already have an account?"
     },
     {
      "label": "Sign in",
      "href": "00-prototype.html#auth-login",
      "grade": "quiet"
     }
    ]
   }
  },
  "network": {
   "route": "auth-register-network",
   "form": {
    "heading": "Create an account",
    "headingId": "register-heading",
    "notice": "We could not reach the server. Your email and password are still in the form.",
    "form": {
     "action": "00-prototype.html#today-first"
    },
    "fields": [
     {
      "id": "re-network-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "value": "mubeen@example.com",
       "required": true
      },
      "lines": []
     },
     {
      "id": "re-network-pass",
      "label": "Password",
      "attrs": {
       "type": "password",
       "value": "journalday",
       "required": true,
       "minlength": "8"
      },
      "toggle": "Show password",
      "lines": [
       {
        "text": "Use at least 8 characters.",
        "place": "help note"
       }
      ]
     },
     {
      "id": "auth-register-network-confirm-password",
      "label": "Confirm password",
      "attrs": {
       "type": "password",
       "value": "journalday",
       "required": true,
       "minlength": "8",
       "autocomplete": "new-password"
      },
      "toggle": "Show confirmed password",
      "lines": []
     }
    ],
    "submit": "Try again",
    "actions": [
     {
      "text": "Already have an account?"
     },
     {
      "label": "Sign in",
      "href": "00-prototype.html#auth-login",
      "grade": "quiet"
     }
    ]
   }
  }
 }
};
