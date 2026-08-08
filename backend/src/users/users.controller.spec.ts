import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';

describe('UsersController', () => {
  let controller: UsersController;
  let service: { create: jest.Mock; findAll: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate create user to service', async () => {
    const dto = {
      email: 'test@test.com',
      password: 'pass',
      fullName: 'Test',
      role: Role.FACULTY,
    };
    service.create.mockResolvedValue({ id: '1', ...dto });

    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: '1', ...dto });
  });
});
