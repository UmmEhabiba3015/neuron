import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// Hand-written because the library options do not fit: `@IsNotEmpty()` accepts
// "   ", and `@Matches(/\S/)` reports `content must match /\S/ regular
// expression`. Supplying `message` to `@Matches` would hand-write that sentence
// at both use sites, free to drift (ADR-008).
export function ContainsNonWhitespace(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'containsNonWhitespace',
      // A property decorator is handed the prototype, so the class is reached
      // through `.constructor`.
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        // Non-strings are accepted deliberately: `@IsString()` already reports
        // them, and firing here too would answer `{"content": 42}` with two
        // messages, one of them noise. This is only safe beside `@IsString()`,
        // and both DTOs pair it that way.
        validate(value: unknown): boolean {
          return typeof value !== 'string' || value.trim().length > 0;
        },
        // `.trim()` decides but never edits: storage gets the string as sent.
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must contain at least one character that is not whitespace`;
        },
      },
    });
  };
}
