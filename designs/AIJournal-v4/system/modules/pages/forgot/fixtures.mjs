// Reset your password: each state (15-auth-states), at the catalogue's width.
export default [
 {
  "name": "default",
  "note": "#auth-forgot",
  "props": {
   "platform": "mobile",
   "state": "default"
  }
 },
 {
  "name": "invalid",
  "state": "error",
  "note": "#auth-forgot-invalid",
  "props": {
   "platform": "tablet",
   "state": "invalid"
  }
 },
 {
  "name": "sending",
  "state": "loading",
  "note": "#auth-forgot-sending",
  "props": {
   "platform": "desktop",
   "state": "sending"
  }
 },
 {
  "name": "sent",
  "note": "#auth-forgot-sent",
  "props": {
   "platform": "mobile",
   "state": "sent"
  }
 },
 {
  "name": "network",
  "state": "error",
  "note": "#auth-forgot-network",
  "props": {
   "platform": "mobile",
   "state": "network"
  }
 },
  // Pages round 5: as the prototypes and the website draw it (the navbar page where it has the header section).
  { name: 'Walkthrough', note: 'context walkthrough, mobile.', props: { platform: 'mobile', state: 'default', context: 'walkthrough' } },
];
