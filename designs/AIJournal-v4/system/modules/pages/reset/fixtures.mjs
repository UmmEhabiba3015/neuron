// Choose a new password: each state (15-auth-states), at the catalogue's width.
export default [
 {
  "name": "default",
  "note": "#auth-reset",
  "props": {
   "platform": "mobile",
   "state": "default"
  }
 },
 {
  "name": "short",
  "state": "error",
  "note": "#auth-reset-short",
  "props": {
   "platform": "tablet",
   "state": "short"
  }
 },
 {
  "name": "saving",
  "state": "loading",
  "note": "#auth-reset-saving",
  "props": {
   "platform": "desktop",
   "state": "saving"
  }
 },
 {
  "name": "expired",
  "state": "error",
  "note": "#auth-reset-expired",
  "props": {
   "platform": "mobile",
   "state": "expired"
  }
 },
 {
  "name": "network",
  "state": "error",
  "note": "#auth-reset-network",
  "props": {
   "platform": "mobile",
   "state": "network"
  }
 },
  // Pages round 5: as the prototypes and the website draw it (the navbar page where it has the header section).
  { name: 'Walkthrough', note: 'context walkthrough, mobile.', props: { platform: 'mobile', state: 'default', context: 'walkthrough' } },
];
