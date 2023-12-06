import { EntitySchema } from 'typeorm';
import { POSTGRES } from '../../../app/helpers/db_type';
import { User } from '../../domain/entities/user.entity';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,

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

    refreshTokenHashed: {
      type: String,
      nullable: true,
    },
    createdAt: {
      type: !POSTGRES ? 'datetime' : Date,
      createDate: true,
    },

    updatedAt: {
      type: !POSTGRES ? 'datetime' : Date,
      updateDate: true,
    },
  },
});
