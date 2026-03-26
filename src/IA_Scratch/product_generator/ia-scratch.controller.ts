import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IAScratchService } from './ia-scratch.service';
import {
  GenerateProductIdeaDto,
  GenerateProductResponse,
  HealthResponse,
} from './ia-scratch.model';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('IA Scratch')
@Controller('ia-scratch')
export class IAScratchController {
  constructor(private readonly iaScratchService: IAScratchService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
 // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Générer une idée de produit via Product Generator API',
    description:
      'Délègue la génération d’idée produit à l’API FastAPI locale Product Generator API.',
  })
  @ApiBody({
    type: GenerateProductIdeaDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Idée produit générée avec succès',
    type: Object,
  })
  generateProduct(
    @Body() dto: GenerateProductIdeaDto,
  ): Promise<GenerateProductResponse> {
    return this.iaScratchService.generateIdea(dto);
  }

  @Get('health')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Vérifier l'état de l’API FastAPI Product Generator",
  })
  @ApiResponse({
    status: 200,
    description: 'État de santé de Product Generator API',
    type: Object,
  })
  health(): Promise<HealthResponse> {
    return this.iaScratchService.checkHealth();
  }
}
