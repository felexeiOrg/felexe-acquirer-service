import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { OnboardingType } from '../constants/onboarding-type.enum';

export class StartOnboardingDto {
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;

  @IsEnum(OnboardingType)
  onboardingType: OnboardingType;
}
