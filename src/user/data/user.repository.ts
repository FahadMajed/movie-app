import { Repository } from 'typeorm';
import { User } from '../domain/entities/user.entity';

// user.repository.ts
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cacheable } from 'src/app/decorators/cacheable.decorator';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: CacheModule,
  ) {}

  @Cacheable({ keyPrefix: 'user' })
  async findUserById(id: number): Promise<User | undefined> {
    const user = await this.repo.findOneBy({ id });

    return user;
  }

  @Cacheable({ keyPrefix: 'user_email' })
  async findUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.repo.findOneBy({ email });

    return user;
  }

  async save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  async remove(user: User): Promise<User> {
    return this.repo.remove(user);
  }

  async update(id: number, user: Partial<User>) {
    this.repo.update(id, user);
  }
}
