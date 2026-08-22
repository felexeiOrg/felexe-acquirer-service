import { AccessTokenPayload } from '../token.service';

export interface AuthenticatedRequest {
  user: AccessTokenPayload;
}
