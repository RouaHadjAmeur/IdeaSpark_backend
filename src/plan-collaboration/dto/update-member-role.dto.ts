import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MemberRole } from '../schemas/plan-member.schema';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: MemberRole }) @IsEnum(MemberRole) role: MemberRole;
}
