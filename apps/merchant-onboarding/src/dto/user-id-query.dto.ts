import { IsNotEmpty, IsUUID } from 'class-validator';

export class UserIdQueryDto {
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;
}
