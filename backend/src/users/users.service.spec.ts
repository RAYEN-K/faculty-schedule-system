import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('throws ConflictException if the email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@a.com' });
    await expect(
      service.create({
        email: 'a@a.com',
        password: 'password123',
        fullName: 'A',
        role: Role.FACULTY,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('hashes the password before creating the user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: '1', email: 'b@b.com' });

    await service.create({
      email: 'b@b.com',
      password: 'password123',
      fullName: 'B',
      role: Role.FACULTY,
    });

    const [[createArgs]] = prisma.user.create.mock.calls as unknown as [
      [{ data: { password: string } }],
    ];
    expect(createArgs.data.password).not.toBe('password123');
  });
});
