import { Controller, Get, Req, StreamableFile } from '@nestjs/common';
import type { AuthenticatedRequest } from '../shared/types/authenticated-request.interface';
import { ExportService } from './export.service';

/*
 * GET /export: the person's whole journal as one ZIP (ADR-025). The name to
 * save it under is in Content-Disposition, with today's date in the
 * person's timezone; the web app reads it from there, so the browser's
 * clock never makes the date (ADR-015).
 */
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  async download(
    @Req() request: AuthenticatedRequest,
  ): Promise<StreamableFile> {
    const file = await this.exportService.build(request.user);

    return new StreamableFile(file.bytes, {
      type: 'application/zip',
      disposition: `attachment; filename="${file.filename}"`,
      length: file.bytes.length,
    });
  }
}
