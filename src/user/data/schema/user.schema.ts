import { EntitySchema } from 'typeorm';
import { MONGO } from '../../../app/helpers/db_type';
import { User } from '../../domain/entities/user.entity';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,

  columns: {
    id: {
      type: String,
      objectId: true,
      primary: true,
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
      type: !MONGO ? 'datetime' : Date,
      createDate: true,
    },

    updatedAt: {
      type: !MONGO ? 'datetime' : Date,
      updateDate: true,
    },
  },
});
