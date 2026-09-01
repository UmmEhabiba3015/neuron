import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// `PATCH` is a partial update, so every field it accepts has to be optional —
// and an all-optional DTO has nothing to object to in `{}`. No single-property
// decorator can express "at least one field must be present", because the rule
// is about the object rather than about any one property (ADR-008, Decision 5).
//
// `class-validator` has no documented class-level registration. It does have
// one that works, and this is the whole of it: every rule is grouped by the
// property it was registered against, and a rule registered against *no*
// property is looked up as `object[undefined]` — so it runs once, sees
// `undefined` as its value, and receives the entire object in
// `args.object`. That is the mechanism this file leans on; it is verified by
// the tests in `update-entry.dto.spec.ts`, which fail if it ever stops working.
export function ContainsAtLeastOneField(validationOptions?: ValidationOptions) {
  // A class decorator is handed the constructor itself, not the prototype — the
  // opposite of the property decorator in
  // `contains-non-whitespace.decorator.ts`, which has to reach the class
  // through `.constructor`. Spelled as a constructor signature rather than as
  // `Function`, which lint rejects for accepting anything callable.
  return function (target: new (...args: unknown[]) => object): void {
    registerDecorator({
      name: 'containsAtLeastOneField',
      target,
      // The whole point, and the reason for the cast: the rule belongs to the
      // class, not to a property, and `registerDecorator` has no way to say so
      // in its types.
      propertyName: undefined as unknown as string,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          // `value` is `object["undefined"]` — the property this rule was
          // registered against, spelled as a string. Normally that is nothing.
          // It is *something* only when a client sent a field named literally
          // `undefined`, and such a field would otherwise slip past
          // `forbidNonWhitelisted`, because this rule's own metadata is what
          // makes that name look recognised. Rejecting it here closes that gap:
          // the message is not the one the sender deserves, but the answer is
          // the 400 that every other unrecognised field gets.
          if (value !== undefined) {
            return false;
          }

          // A declared-but-unsent property is present on the instance holding
          // `undefined` — `plainToInstance` materialises the whole shape — so
          // counting keys would count `{}` as one field. Counting *values that
          // arrived* is the question actually being asked.
          return Object.values(args.object).some(
            (field) => field !== undefined,
          );
        },
        // Written for a person, and written to say what to do about it rather
        // than what went wrong. The wording names updating because
        // `UpdateEntryDto` is the only class using this today; a second use
        // site should pass its own `message`.
        defaultMessage(): string {
          return 'the request body must contain at least one field to update';
        },
      },
    });
  };
}
