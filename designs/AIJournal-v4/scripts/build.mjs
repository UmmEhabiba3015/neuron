// One ordered build: page modules -> screens (every screen written from its comp) -> portable exports.
// Browser verification is explicit and does not run as a build side effect.
for(const step of [
 'build-modules.mjs','../tools/pages/write-screens.mjs',
 'update-portable-fonts.mjs','build-prototypes.mjs',
 'build-motion.mjs','../design system/build-export.mjs','audit-v3.mjs'
]){
 console.log('Build step: '+step);
 await import(new URL(step,import.meta.url));
}
