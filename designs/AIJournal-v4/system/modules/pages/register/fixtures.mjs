// Create an account: each state (15-auth-states), at the catalogue's width.
export default [
 {
  "name": "default",
  "note": "#auth-register",
  "props": {
   "platform": "mobile",
   "state": "default"
  }
 },
 {
  "name": "error",
  "state": "error",
  "note": "#auth-register-error",
  "props": {
   "platform": "tablet",
   "state": "error"
  }
 },
 {
  "name": "invalid",
  "state": "error",
  "note": "#auth-register-invalid",
  "props": {
   "platform": "desktop",
   "state": "invalid"
  }
 },
 {
  "name": "short",
  "state": "error",
  "note": "#auth-register-short",
  "props": {
   "platform": "mobile",
   "state": "short"
  }
 },
 {
  "name": "creating",
  "state": "loading",
  "note": "#auth-register-creating",
  "props": {
   "platform": "mobile",
   "state": "creating"
  }
 },
 {
  "name": "network",
  "state": "error",
  "note": "#auth-register-network",
  "props": {
   "platform": "mobile",
   "state": "network"
  }
 },
  // Pages round 5: as the prototypes and the website draw it (the navbar page where it has the header section).
  { name: 'Walkthrough', note: 'context walkthrough, mobile.', props: { platform: 'mobile', state: 'default', context: 'walkthrough' } },
];
