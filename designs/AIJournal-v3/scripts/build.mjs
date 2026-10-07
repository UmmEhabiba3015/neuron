// One ordered build: authored screens -> contextual states -> portable exports.
// Browser verification is explicit and does not run as a build side effect.
for(const step of [
 'apply-entry-controls.mjs','apply-compact-recorder.mjs','apply-v3-states.mjs',
 'normalize-web-screens.mjs','update-portable-fonts.mjs','build-prototypes.mjs',
 'build-motion.mjs','../design system/build-export.mjs','audit-v3.mjs'
]){
 console.log('Build step: '+step);
 await import(new URL(step,import.meta.url));
}
