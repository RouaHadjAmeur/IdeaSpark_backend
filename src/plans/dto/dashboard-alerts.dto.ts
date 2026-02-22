import { IsString, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BrandContextDto {
    @ApiProperty() @IsString() id: string;
    @ApiProperty() @IsString() name: string;
    @ApiProperty() hasActivePlan: boolean;
}

export class PlanContextDto {
    @ApiProperty() @IsString() id: string;
    @ApiProperty() @IsString() name: string;
    @ApiProperty() @IsString() brandName: string;
    @ApiProperty() @IsString() status: string;
    @ApiProperty() @IsString() objective: string;
    @ApiProperty() @IsString() startDate: string;
    @ApiProperty() @IsString() endDate: string;
    @ApiProperty() @IsNumber() durationWeeks: number;
    @ApiProperty() @IsNumber() promoRatio: number;
}

export class EntryContextDto {
    @ApiProperty() @IsString() planName: string;
    @ApiProperty() @IsString() brandName: string;
    @ApiProperty() @IsString() title: string;
    @ApiProperty() @IsString() platform: string;
    @ApiPropertyOptional() @IsOptional() @IsString() format?: string;
    @ApiProperty() @IsString() status: string;
    @ApiProperty() @IsString() scheduledDate: string;
    @ApiPropertyOptional() @IsOptional() @IsString() scheduledTime?: string;
}

export class DashboardAlertsRequestDto {
    @ApiProperty() @IsString() currentDateTime: string;
    @ApiProperty({ type: [BrandContextDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => BrandContextDto) brands: BrandContextDto[];
    @ApiProperty({ type: [PlanContextDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => PlanContextDto) plans: PlanContextDto[];
    @ApiProperty({ type: [EntryContextDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => EntryContextDto) entries: EntryContextDto[];
}

export class DashboardAlertDto {
    @ApiProperty() type: string;
    @ApiProperty() severity: string;
    @ApiProperty() message: string;
}

export class DashboardAlertsResponseDto {
    @ApiProperty({ type: [DashboardAlertDto] }) alerts: DashboardAlertDto[];
}
