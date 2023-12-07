import { EntitySchema } from 'typeorm';
import { User } from '../../domain/entities/user.entity';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,

  columns: {
    _id: {
      type: String,
      objectId: true,
      primary: true,
      name: 'id',
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
      type: Date,
      createDate: true,
    },

    updatedAt: {
      type: Date,
      updateDate: true,
    },
  },
});
