import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// PATCH makes every field optional, and an all-optional DTO has nothing to
// object to in `{}`. No property decorator can express this, because the rule
// is about the object (ADR-008).
//
// class-validator has no documented class-level registration. The mechanism
// this leans on: rules are grouped by the property they were registered
// against, so a rule registered against *no* property is looked up as
// `object[undefined]` — it runs once and receives the whole object in
// `args.object`. Pinned by update-entry.dto.spec.ts, which fails if that ever
// stops working.
export function ContainsAtLeastOneField(validationOptions?: ValidationOptions) {
  // A class decorator receives the constructor, not the prototype.
  return function (target: new (...args: unknown[]) => object): void {
    registerDecorator({
      name: 'containsAtLeastOneField',
      target,
      propertyName: undefined as unknown as string,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          // `value` is `object["undefined"]`, normally nothing. It is something
          // only when a client sent a field literally named `undefined`, which
          // would otherwise slip past `forbidNonWhitelisted` because this
          // rule's metadata makes that name look recognised.
          if (value !== undefined) {
            return false;
          }

          // `plainToInstance` materialises declared-but-unsent properties as
          // `undefined`, so counting keys would count `{}` as one field.
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
