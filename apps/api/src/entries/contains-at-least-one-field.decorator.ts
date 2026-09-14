import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function ContainsAtLeastOneField(validationOptions?: ValidationOptions) {
  return function (target: new (...args: unknown[]) => object): void {
    registerDecorator({
      name: 'containsAtLeastOneField',
      target,
      propertyName: undefined as unknown as string,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (value !== undefined) {
            return false;
          }

          return Object.values(args.object).some(
            (field) => field !== undefined,
          );
        },
        defaultMessage(): string {
          return 'the request body must contain at least one field to update';
        },
      },
    });
  };
}
