import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PromptRefinerService } from './prompt-refiner.service';
import { RefinePromptDto, RefinePromptResponse } from './prompt-refiner.model';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Prompt Refiner')
@Controller('prompt-refiner')
export class PromptRefinerController {
  constructor(private readonly promptRefinerService: PromptRefinerService) {}

  @Post('refine')
  @HttpCode(HttpStatus.OK)
  //@UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Raffiner un prompt en utilisant le service Prompt Refiner (FastAPI)',
    description:
      'Envoie le prompt brut au FastAPI Prompt Refiner (Mistral 7B GGUF) et renvoie la version structurée.',
  })
  @ApiBody({
    type: RefinePromptDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Prompt raffiné avec succès',
    schema: {
      example: {
        result:
          '[RÔLE]: Expert en marketing digital\n[CONTEXTE]: ...\n[TÂCHE]: ...\n[CONTRAINTES/STYLE]: ...\n[VARIABLES]: ...\n[FORMAT DE SORTIE]: ...',
      },
    },
  })
  refine(@Body() dto: RefinePromptDto): Promise<RefinePromptResponse> {
    return this.promptRefinerService.refinePrompt(dto);
  }
}

