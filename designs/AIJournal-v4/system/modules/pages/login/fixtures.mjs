// Sign in: each state (15-auth-states), at the catalogue's width.
export default [
 {
  "name": "default",
  "note": "#auth-login",
  "props": {
   "platform": "mobile",
   "state": "default"
  }
 },
 {
  "name": "error",
  "state": "error",
  "note": "#auth-login-error",
  "props": {
   "platform": "tablet",
   "state": "error"
  }
 },
 {
  "name": "invalid",
  "state": "error",
  "note": "#auth-login-invalid",
  "props": {
   "platform": "desktop",
   "state": "invalid"
  }
 },
 {
  "name": "sending",
  "state": "loading",
  "note": "#auth-login-sending",
  "props": {
   "platform": "mobile",
   "state": "sending"
  }
 },
 {
  "name": "network",
  "state": "error",
  "note": "#auth-login-network",
  "props": {
   "platform": "mobile",
   "state": "network"
  }
 },
 {
  "name": "after-reset",
  "note": "#auth-login-after-reset",
  "props": {
   "platform": "mobile",
   "state": "after-reset"
  }
 },
 {
  "name": "after-delete",
  "note": "#auth-login-after-delete",
  "props": {
   "platform": "mobile",
   "state": "after-delete"
  }
 },
 {
  "name": "after-session",
  "note": "#auth-login-after-session",
  "props": {
   "platform": "mobile",
   "state": "after-session"
  }
 },
 {
  "name": "signed-out",
  "note": "#auth-signed-out",
  "props": {
   "platform": "mobile",
   "state": "signed-out"
  }
 },
  // Pages round 5: as the prototypes and the website draw it (the navbar page where it has the header section).
  { name: 'Walkthrough', note: 'context walkthrough, mobile.', props: { platform: 'mobile', state: 'default', context: 'walkthrough' } },
];
