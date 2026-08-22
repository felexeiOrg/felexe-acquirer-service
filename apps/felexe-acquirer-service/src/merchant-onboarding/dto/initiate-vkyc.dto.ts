import { IsIn, IsUUID } from 'class-validator';

export class InitiateVkycDto {
  @IsUUID('4')
  personId: string;

  @IsIn(['Director', 'Authorizer'], {
    message: 'type must be Director or Authorizer',
  })
  type: 'Director' | 'Authorizer';
}
