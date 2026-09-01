import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// The one content rule `class-validator` does not already own.
//
// A library knows about shapes — "is this a string", "does this object carry
// keys nobody declared" — because every application asks those questions. "The
// text must contain something a person can actually see" is a decision about a
// journal, and the library has never heard of journals (ADR-008).
//
// Two library decorators were run against the real cases before this file was
// written, and neither does the job:
//
//   @IsNotEmpty()      accepts "   ". It rejects the empty string and nothing
//                      else, so an entry of three spaces would be stored.
//   @Matches(/\S/)     enforces the rule, and reports it as
//                      `content must match /\S/ regular expression` — which
//                      tells the sender nothing and leaks the implementation.
//
// Supplying `message` to `@Matches` fixes the wording and hand-writes it at
// every use site. `content` is validated in *two* DTOs, so that sentence would
// exist twice and the two copies would drift the moment one was edited. Here
// the check and the sentence it produces travel together, written once
// (ADR-008, Decision 4).
export function ContainsNonWhitespace(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'containsNonWhitespace',
      // `registerDecorator` keys its metadata by the class, and a property
      // decorator is handed the *prototype* — so the class itself is reached
      // through `.constructor`.
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        // A value that is not a string is deliberately *accepted* here, and
        // that is not an oversight. `@IsString()` is already going to report
        // it, and a validator that also fired would make `{"content": 42}`
        // answer with two messages of which one is noise — the exact defect
        // that ruled `@Matches(/\S/)` out. Each decorator answers one question:
        // this one answers "is there anything visible in this text", and only
        // text can be asked.
        //
        // The cost is that this decorator is only safe beside a decorator that
        // establishes the value is a string. Both DTOs pair it with
        // `@IsString()`, and a future one must too.
        validate(value: unknown): boolean {
          return typeof value !== 'string' || value.trim().length > 0;
        },
        // `.trim()` above decides; it never edits. What reaches storage is the
        // string the user actually sent, spacing and all (ADR-005).
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must contain at least one character that is not whitespace`;
        },
      },
    });
  };
}
