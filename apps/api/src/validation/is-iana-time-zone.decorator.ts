import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

/*
 * The name a timezone is stored under, or undefined if the value is not one.
 *
 * Intl decides what exists, and it knows more spellings than one per zone:
 * it reads asia/karachi and EST, and answers Asia/Karachi and
 * America/Panama. The answer is what is stored, so one zone is always
 * written one way.
 *
 * Intl also accepts a fixed offset such as +05:00, and answers with the
 * offset. That is refused. An offset is where a clock stands today, and it
 * does not know when that clock changes for summer. Only an offset begins
 * with a sign, so the sign on Intl's answer is the test. class-validator's
 * own IsTimeZone asks Intl the same question and stops there, which is why
 * it is not used.
 */
export function resolveTimeZone(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  let resolved: string;

  try {
    resolved = new Intl.DateTimeFormat('en-US', {
      timeZone: value,
    }).resolvedOptions().timeZone;
  } catch {
    return undefined;
  }

  if (/^[+-]/.test(resolved)) {
    return undefined;
  }

  return resolved;
}

export function IsIanaTimeZone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isIanaTimeZone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return resolveTimeZone(value) !== undefined;
        },

        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be an IANA time zone name such as Asia/Karachi`;
        },
      },
    });
  };
}
