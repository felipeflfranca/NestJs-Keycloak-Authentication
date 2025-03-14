import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  document: string;

  @IsString()
  userType: string;

  @IsString()
  @MinLength(6, { message: 'The password must be at least 6 characters long.' })
  password: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'The user must have at least one role.' })
  @IsString({ each: true }) // Ensures that each item in the array is a string
  roles: string[];
}
