import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode, HEADER_SERVICE_TOKEN } from '@app/shared-kernel';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const raw = req.headers[HEADER_SERVICE_TOKEN];
    const token = Array.isArray(raw) ? raw[0] : raw;
    const expected = this.config.getOrThrow<string>('SERVICE_TOKEN_COMPTES');
    if (!token || token !== expected) {
      throw new UnauthorizedException({ code: ErrorCode.UNAUTHORIZED });
    }
    return true;
  }
}
