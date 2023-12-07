/* eslint-disable @typescript-eslint/no-unused-vars */
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

export class CreateMovieRequest {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotRequest)
  timeSlots: TimeSlotRequest[];
}

class TimeSlotRequest {
  @IsDate({ message: 'startTime must be a valid date' })
  @NoSecondsOrMilliseconds()
  @Type(() => Date)
  startTime: Date;

  @IsDate({ message: 'endTime must be a valid date' })
  @IsLaterThan('startTime', {
    message: 'endTime must be greater than startTime',
  })
  @NoSecondsOrMilliseconds()
  @Type(() => Date)
  endTime: Date;

  @Min(1)
  capacity: number;
}

//ENSURES THAT THE DATE DOES NOT CONTAIN CUSTOM MILLISECONDS OR SECONDS
function NoSecondsOrMilliseconds(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'noSecondsOrMilliseconds',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!(value instanceof Date)) return false;
          return value.getSeconds() === 0 && value.getMilliseconds() === 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must only include hours and minutes`;
        },
      },
    });
  };
}

function IsLaterThan(property: string, validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isLaterThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return (
            typeof value === 'string' &&
            typeof relatedValue === 'string' &&
            new Date(value) > new Date(relatedValue)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be later than ${args.constraints[0]}`;
        },
      },
    });
  };
}
