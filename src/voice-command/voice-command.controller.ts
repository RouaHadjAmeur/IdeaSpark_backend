import { Controller, Get, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VoiceCommandService, ParseResult, ConfirmResult } from './voice-command.service';
import { ParseCommandDto } from './dto/parse-command.dto';
import { ConfirmCommandDto } from './dto/confirm-command.dto';
import { ParseResultDto } from './dto/voice-action-response.dto';
import { VoiceCommandsCatalogDto } from './dto/voice-commands-catalog.dto';

@ApiTags('Voice Command')
@Controller('api/voice')
export class VoiceCommandController {
    private readonly logger = new Logger(VoiceCommandController.name);

    constructor(private readonly voiceService: VoiceCommandService) { }

    @Get('commands')
    @ApiOperation({
        summary: 'Get all supported voice commands',
        description:
            'Returns every supported intent with examples, and every navigable route with its accepted aliases. ' +
            'Use this to build help UIs or validate supported phrases on the client.',
    })
    @ApiResponse({
        status: 200,
        description: 'Full catalog of supported voice commands and navigable routes',
        type: VoiceCommandsCatalogDto,
    })
    getCommandsCatalog(): VoiceCommandsCatalogDto {
        return this.voiceService.getCommandsCatalog();
    }

    @Post('parse')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Parse voice command into structured actions' })
    @ApiResponse({
        status: 200,
        description:
            'Command parsed. actions[] contains validated actions with canonical destination names. ' +
            'destinationText is never present in the response.',
        type: ParseResultDto,
    })
    async parse(@Body() dto: ParseCommandDto): Promise<ParseResult> {
        this.logger.log(`Parsing voice command: "${dto.text}"`);
        return this.voiceService.parse(dto.text, dto.context);
    }

    @Post('confirm')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Confirm a pending action' })
    @ApiResponse({ status: 200, description: 'Confirmation processed' })
    async confirm(@Body() dto: ConfirmCommandDto): Promise<ConfirmResult> {
        this.logger.log(`Confirming action ${dto.confirmationKey} with text "${dto.text}"`);
        return this.voiceService.confirm(dto.confirmationKey, dto.text);
    }
}
