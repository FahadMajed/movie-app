import { EntitySchema } from 'typeorm';
import { POSTGRES } from '../../../app/helpers/db_type';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/enums/role.enum';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,
  checks: [
    {
      expression: "role IN ('User', 'Admin')",
      name: 'Role_ENUM_VALUES',
    },
  ],
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    email: {
      type: String,
      nullable: true,
    },
    firstName: {
      type: String,
      nullable: true,
    },
    lastName: {
      type: String,
      nullable: true,
    },
    passwordHash: {
      type: String,
      nullable: true,
    },
    role: {
      type: 'varchar',
      enum: Role,
      nullable: true,
      default: Role.User,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
      nullable: true,
    },
    refreshTokenHashed: {
      type: String,
      nullable: true,
    },
    createdAt: {
      type: !POSTGRES ? 'datetime' : Date,
      createDate: true,
    },
    lastActivityAt: {
      type: !POSTGRES ? 'datetime' : Date,
      nullable: true,
    },
    updatedAt: {
      type: !POSTGRES ? 'datetime' : Date,
      updateDate: true,
    },
  },
});
