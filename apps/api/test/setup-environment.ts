// Every end-to-end spec boots the real `AppModule`, and as of Day 9 that
// refuses to start without `JWT_SECRET` — deliberately, because there is no
// safe default for a signing key (ADR-007, ADR-012).
//
// That rule is correct and it makes the test suite unrunnable unless something
// supplies one. This is that something, and it is a `??=` rather than an
// assignment on purpose: a spec that sets its own value — `config-wiring` and
// `env-file` both exercise what happens when configuration is wrong — keeps it,
// and this only fills the gap for the specs that have no opinion.
//
// The value is obviously fake and obviously test-only. It is long enough to
// pass the length floor and it is in version control, which is exactly why it
// must never be the value anything real is signed with.
process.env.JWT_SECRET ??=
  'test-only-signing-secret-never-use-this-anywhere-real';
