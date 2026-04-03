import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MemberRole } from '../schemas/plan-member.schema';

export class InviteMemberDto {
  @ApiProperty() @IsString() @IsNotEmpty() planId: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ enum: MemberRole, default: MemberRole.EDITOR })
  @IsEnum(MemberRole) role: MemberRole = MemberRole.EDITOR;
}
