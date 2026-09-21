import { IsString } from 'class-validator';

export class RefreshDto {
  @IsString()
  sessionId: string;

  @IsString()
  refreshToken: string;
}
