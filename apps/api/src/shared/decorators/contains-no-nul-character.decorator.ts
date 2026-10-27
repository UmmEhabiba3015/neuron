import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/*
 * Postgres cannot store the NUL character (U+0000) in text, and refuses a
 * query that carries one, even as a search term. SQLite stored it. Without
 * this rule a NUL in an entry, a name, a search or a sign-in would reach the
 * database and come back as a 500; with it, it is a 400 that says why.
 *
 * It is refused rather than removed, for ADR-005's reason: this layer does
 * not quietly edit what somebody wrote.
 */
export function ContainsNoNulCharacter(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'containsNoNulCharacter',

      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value !== 'string' || !value.includes('\u0000');
        },

        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must not contain the NUL character (U+0000)`;
        },
      },
    });
  };
}
