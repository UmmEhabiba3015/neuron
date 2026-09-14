import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function ContainsNonWhitespace(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'containsNonWhitespace',

      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value !== 'string' || value.trim().length > 0;
        },

        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must contain at least one character that is not whitespace`;
        },
      },
    });
  };
}
