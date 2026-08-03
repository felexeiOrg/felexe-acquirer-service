import { IsNotEmpty, IsString, Matches } from 'class-validator';

/** Frontend only sends PAN. RPACPC payload is built in KYC microservice. */
export class VerifyPanDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, {
    message: 'pan must be a valid PAN format',
  })
  pan: string;
}
