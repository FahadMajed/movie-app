import { PartialType } from '@nestjs/mapped-types';
import { CreateUserRequest } from './create_user.request';

export class UpdateUserDto extends PartialType(CreateUserRequest) {}
