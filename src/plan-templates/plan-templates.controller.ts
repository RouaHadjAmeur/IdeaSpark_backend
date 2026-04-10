import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanTemplatesService } from './plan-templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@ApiTags('Plan Templates')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('plan-templates')
export class PlanTemplatesController {
  constructor(private readonly service: PlanTemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Sauvegarder un template de plan' })
  create(@Body() dto: CreateTemplateDto, @Request() req: any) {
    return this.service.create(req.user._id || req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les templates de l\'utilisateur' })
  findAll(@Request() req: any) {
    return this.service.findAll(req.user._id || req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un template' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.service.delete(id, req.user._id || req.user.id);
  }
}
