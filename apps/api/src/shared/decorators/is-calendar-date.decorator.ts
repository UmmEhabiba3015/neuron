import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

/*
 * A YYYY-MM-DD regex accepts 2026-13-45, which has the right shape and is
 * not a date. A day is addressed by its date, so the date is an identifier
 * and a wrong one should be a 400 rather than a lookup that finds nothing.
 *
 * Round-tripping through Date catches both: the parse rejects nonsense, and
 * comparing the result back to the input catches values that JavaScript
 * silently rolls over, such as 2026-02-31 becoming 2 March.
 */
export function IsCalendarDate(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCalendarDate',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') {
            return false;
          }

          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
          }

          const parsed = new Date(`${value}T00:00:00.000Z`);

          return (
            !Number.isNaN(parsed.getTime()) &&
            parsed.toISOString().slice(0, 10) === value
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a real calendar date in YYYY-MM-DD form`;
        },
      },
    });
  };
}
