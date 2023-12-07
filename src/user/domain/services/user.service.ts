import { ConflictException, Injectable } from '@nestjs/common';
import { UserRepository } from 'src/user/data/user.repository';
import { CreateUserRequest } from 'src/user/presentation/requests/create_user.request';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(request: CreateUserRequest): Promise<User> {
    if (await this.userExists(request.email)) {
      throw new ConflictException('This email address is already in use.');
    }
    let user = new User();
    user.email = request.email;
    user.passwordHash = request.password;

    user = await this.userRepository.save(user);
    return user;
  }
  async userExists(email: string) {
    const user = await this.findByEmail(email);
    return user != null;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findUserByEmail(email);
  }

  async findById(id: string): Promise<User> {
    return this.userRepository.findUserById(id);
  }

  async addRefreshToken(refreshTokenHashed: string, id: string) {
    this.userRepository.update(id, {
      refreshTokenHashed: refreshTokenHashed,
    });
  }
}
