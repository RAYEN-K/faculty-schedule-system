import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { AI_FALLBACK } from './ai.types';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: {} },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: unknown) => {
              if (key === 'AI_SERVICE_URL') return 'http://localhost:8000';
              if (key === 'AI_SERVICE_TIMEOUT_MS') return 50;
              return fallback;
            },
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('maps medical reasons', () => {
    expect(service.mapReasonType('Doctor appointment')).toBe('Medical');
  });

  it('returns Pending when the AI service is unreachable', async () => {
    const spy = jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await service.predict({
      working_days_count: 3,
      has_schedule_conflict: 0,
      institutional_event_conflict: 0,
      previous_requests_count: 1,
      department_coverage: 0.8,
      reason_type: 'Personal',
    });
    spy.mockRestore();
    expect(result.recommendation).toBe(AI_FALLBACK.recommendation);
  });
});
