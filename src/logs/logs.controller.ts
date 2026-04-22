import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Log } from './schemas/log.schema';

@ApiTags('Logs')
@Controller('logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all activity logs (Admins only)' })
  @ApiResponse({ status: 200, type: [Log] })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getAllLogs(
    @Query('query') query?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logsService.findAll(query, startDate, endDate);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search logs instant (Admins only)' })
  @ApiResponse({ status: 200, type: [Log] })
  @ApiQuery({ name: 'query', required: true })
  async searchLogs(@Query('query') query: string) {
    return this.logsService.findAll(query);
  }
}
