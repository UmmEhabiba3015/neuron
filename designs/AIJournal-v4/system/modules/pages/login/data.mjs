// Sign in and its states (journal-website.html): each state's route (the shell's id) and its form
// section's data (system/modules/sections/auth-form), read from the screens' final markup.
export default {
 "spread": "login",
 "states": {
  "default": {
   "route": "auth-login",
   "form": {
    "heading": "Sign in",
    "headingId": "login-heading",
    "copy": "Open your journal on this device.",
    "copyTyped": true,
    "form": {
     "action": "00-prototype.html#today",
     "name": "login",
     "novalidate": true
    },
    "fields": [
     {
      "id": "login-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "autocomplete": "email",
       "inputmode": "email",
       "required": true,
       "aria-describedby": "login-email-error"
      },
      "auth": "email",
      "lines": [
       {
        "text": "",
        "place": "help note",
        "attrs": {
         "id": "login-email-error",
         "hidden": true
        },
        "data": {
         "field-error": true
        }
       }
      ]
     },
     {
      "id": "login-password",
      "label": "Password",
      "attrs": {
       "type": "password",
       "autocomplete": "current-password",
       "required": true,
       "minlength": "8",
       "aria-describedby": "login-password-error"
      },
      "auth": "password",
      "toggle": "Show password",
      "lines": [
       {
        "text": "",
        "place": "help note",
        "attrs": {
         "id": "login-password-error",
         "hidden": true
        },
        "data": {
         "field-error": true
        }
       }
      ],
      "forgot": {
       "label": "Forgot your password?",
       "href": "00-prototype.html#auth-forgot"
      }
     }
    ],
    "submit": "Sign in",
    "actions": [
     {
      "label": "Create an account",
      "href": "00-prototype.html#auth-register",
      "grade": "quiet"
     }
    ],
    "preview": [
     {
      "label": "Incorrect details",
      "href": "00-prototype.html#auth-login-error"
     },
     {
      "label": "Signing in",
      "href": "00-prototype.html#auth-login-sending"
     },
     {
      "label": "Session expired",
      "href": "00-prototype.html#auth-login-after-session"
     }
    ]
   }
  },
  "error": {
   "route": "auth-login-error",
   "form": {
    "heading": "Sign in",
    "headingId": "login-heading",
    "notice": "We could not sign you in with those details.",
    "form": {
     "action": "00-prototype.html#today"
    },
    "fields": [
     {
      "id": "li-error-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "value": "mubeen@example.com",
       "required": true,
       "autocomplete": "email"
      },
      "lines": []
     },
     {
      "id": "li-error-pass",
      "label": "Password",
      "attrs": {
       "type": "password",
       "value": "journalday",
       "required": true,
       "autocomplete": "current-password"
      },
      "toggle": "Show password",
      "lines": [],
      "forgot": {
       "label": "Forgot your password?",
       "href": "00-prototype.html#auth-forgot"
      }
     }
    ],
    "submit": "Sign in",
    "actions": [
     {
      "label": "Create an account",
      "href": "00-prototype.html#auth-register",
      "grade": "quiet"
     }
    ]
   }
  },
  "invalid": {
   "route": "auth-login-invalid",
   "form": {
    "heading": "Sign in",
    "headingId": "login-heading",
    "form": {
     "action": "00-prototype.html#today"
    },
    "fields": [
     {
      "id": "li-invalid-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "value": "not-an-email",
       "required": true,
       "aria-invalid": "true",
       "aria-describedby": "li-invalid-help"
      },
      "lines": [
       {
        "text": "Enter an email address.",
        "place": "help",
        "attrs": {
         "id": "li-invalid-help"
        }
       }
      ]
     },
     {
      "id": "li-invalid-pass",
      "label": "Password",
      "attrs": {
       "type": "password",
       "value": "",
       "required": true
      },
      "toggle": "Show password",
      "lines": [],
      "forgot": {
       "label": "Forgot your password?",
       "href": "00-prototype.html#auth-forgot"
      }
     }
    ],
    "submit": "Sign in",
    "actions": [
     {
      "label": "Create an account",
      "href": "00-prototype.html#auth-register",
      "grade": "quiet"
     }
    ]
   }
  },
  "sending": {
   "route": "auth-login-sending",
   "form": {
    "heading": "Sign in",
    "headingId": "login-heading",
    "copy": "Signing you in.",
    "form": {
     "action": "00-prototype.html#today",
     "novalidate": true
    },
    "fields": [
     {
      "id": "login-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "autocomplete": "email",
       "inputmode": "email",
       "required": true,
       "aria-describedby": "login-email-error"
      },
      "auth": "email",
      "lines": [
       {
        "text": "",
        "place": "help note",
        "attrs": {
         "id": "login-email-error",
         "hidden": true
        },
        "data": {
         "field-error": true
        }
       }
      ]
     },
     {
      "id": "login-password",
      "label": "Password",
      "attrs": {
       "type": "password",
       "autocomplete": "current-password",
       "required": true,
       "minlength": "8",
       "aria-describedby": "login-password-error"
      },
      "auth": "password",
      "toggle": "Show password",
      "lines": [
       {
        "text": "",
        "place": "help note",
        "attrs": {
         "id": "login-password-error",
         "hidden": true
        },
        "data": {
         "field-error": true
        }
       }
      ],
      "forgot": {
       "label": "Forgot your password?",
       "href": "00-prototype.html#auth-forgot"
      }
     }
    ],
    "submit": "Sign in",
    "actions": [
     {
      "label": "Create an account",
      "href": "00-prototype.html#auth-register",
      "grade": "quiet"
     }
    ]
   }
  },
  "network": {
   "route": "auth-login-network",
   "form": {
    "heading": "Sign in",
    "headingId": "login-heading",
    "notice": "We could not reach the server. Your details are still here. Try again.",
    "form": {
     "action": "00-prototype.html#today"
    },
    "fields": [
     {
      "id": "li-network-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "value": "mubeen@example.com",
       "required": true
      },
      "lines": []
     },
     {
      "id": "li-network-pass",
      "label": "Password",
      "attrs": {
       "type": "password",
       "value": "journalday",
       "required": true
      },
      "toggle": "Show password",
      "lines": [],
      "forgot": {
       "label": "Forgot your password?",
       "href": "00-prototype.html#auth-forgot"
      }
     }
    ],
    "submit": "Try again",
    "actions": [
     {
      "label": "Create an account",
      "href": "00-prototype.html#auth-register",
      "grade": "quiet"
     }
    ]
   }
  },
  "after-reset": {
   "route": "auth-login-after-reset",
   "form": {
    "heading": "Sign in",
    "headingId": "login-heading",
    "notice": "Your password was changed. Sign in with the new one.",
    "form": {
     "action": "00-prototype.html#today"
    },
    "fields": [
     {
      "id": "li-reset-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "value": "",
       "required": true
      },
      "lines": []
     },
     {
      "id": "li-reset-pass",
      "label": "Password",
      "attrs": {
       "type": "password",
       "value": "",
       "required": true
      },
      "toggle": "Show password",
      "lines": [],
      "forgot": {
       "label": "Forgot your password?",
       "href": "00-prototype.html#auth-forgot"
      }
     }
    ],
    "submit": "Sign in",
    "actions": [
     {
      "label": "Create an account",
      "href": "00-prototype.html#auth-register",
      "grade": "quiet"
     }
    ]
   }
  },
  "after-delete": {
   "route": "auth-login-after-delete",
   "form": {
    "heading": "Sign in",
    "headingId": "login-heading",
    "notice": "Your account and everything in it were deleted.",
    "form": {
     "action": "00-prototype.html#today"
    },
    "fields": [
     {
      "id": "li-deleted-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "value": "",
       "required": true
      },
      "lines": []
     },
     {
      "id": "li-deleted-pass",
      "label": "Password",
      "attrs": {
       "type": "password",
       "value": "",
       "required": true
      },
      "toggle": "Show password",
      "lines": [],
      "forgot": {
       "label": "Forgot your password?",
       "href": "00-prototype.html#auth-forgot"
      }
     }
    ],
    "submit": "Sign in",
    "actions": [
     {
      "label": "Create an account",
      "href": "00-prototype.html#auth-register",
      "grade": "quiet"
     }
    ]
   }
  },
  "after-session": {
   "route": "auth-login-after-session",
   "form": {
    "heading": "Sign in",
    "headingId": "login-heading",
    "notice": "You were signed out. Sign in again to carry on.",
    "form": {
     "action": "00-prototype.html#today"
    },
    "fields": [
     {
      "id": "li-session-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "value": "",
       "required": true
      },
      "lines": []
     },
     {
      "id": "li-session-pass",
      "label": "Password",
      "attrs": {
       "type": "password",
       "value": "",
       "required": true
      },
      "toggle": "Show password",
      "lines": [],
      "forgot": {
       "label": "Forgot your password?",
       "href": "00-prototype.html#auth-forgot"
      }
     }
    ],
    "submit": "Sign in",
    "actions": [
     {
      "label": "Create an account",
      "href": "00-prototype.html#auth-register",
      "grade": "quiet"
     }
    ]
   }
  },
  "signed-out": {
   "route": "auth-signed-out",
   "form": {
    "heading": "Sign in",
    "headingId": "login-heading",
    "copy": "You have been signed out of this device.",
    "form": {
     "action": "00-prototype.html#today",
     "novalidate": true
    },
    "fields": [
     {
      "id": "login-email",
      "label": "Email",
      "attrs": {
       "type": "email",
       "autocomplete": "email",
       "inputmode": "email",
       "required": true,
       "aria-describedby": "login-email-error"
      },
      "auth": "email",
      "lines": [
       {
        "text": "",
        "place": "help note",
        "attrs": {
         "id": "login-email-error",
         "hidden": true
        },
        "data": {
         "field-error": true
        }
       }
      ]
     },
     {
      "id": "login-password",
      "label": "Password",
      "attrs": {
       "type": "password",
       "autocomplete": "current-password",
       "required": true,
       "minlength": "8",
       "aria-describedby": "login-password-error"
      },
      "auth": "password",
      "toggle": "Show password",
      "lines": [
       {
        "text": "",
        "place": "help note",
        "attrs": {
         "id": "login-password-error",
         "hidden": true
        },
        "data": {
         "field-error": true
        }
       }
      ],
      "forgot": {
       "label": "Forgot your password?",
       "href": "00-prototype.html#auth-forgot"
      }
     }
    ],
    "submit": "Sign in",
    "actions": [
     {
      "label": "Create an account",
      "href": "00-prototype.html#auth-register",
      "grade": "quiet"
     }
    ]
   }
  }
 }
};
