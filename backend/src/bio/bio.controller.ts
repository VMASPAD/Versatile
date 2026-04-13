import { Controller, Post, Get, Delete, Body, Param, Req, Res, UseGuards, Request } from '@nestjs/common';
import { BioService } from './bio.service';
import type { BioProfile } from './bio.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import type { Response, Request as ExpressRequest } from 'express';

@Controller('bio')
export class BioController {
  constructor(private readonly bioService: BioService) {}

  /**
   * Public endpoint — Resolves a bio profile and renders the page
   */
  @Get(':username')
  async renderProfile(
    @Param('username') username: string,
    @Req() req: ExpressRequest,
    @Res() res: Response,
  ) {
    const profile = await this.bioService.getPublicProfile(username);
    if (!profile) {
      return res.status(404).send('Profile not found');
    }

    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const apiBase = `${proto}://${host}`;

    const html = this.bioService.renderPublicPage(profile, apiBase);
    res.set({ 'Content-Type': 'text/html' });
    res.send(html);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('api/bio')
export class ApiBioController {
  constructor(private readonly bioService: BioService) {}

  @Post()
  async upsert(@Request() req: any, @Body() dto: BioProfile) {
    return this.bioService.upsertProfile(req.user.username, req.user.dbPassword, dto);
  }

  @Get()
  async getMyProfile(@Request() req: any) {
    return this.bioService.getProfileData(req.user.username, req.user.dbPassword);
  }

  @Delete()
  async remove(@Request() req: any) {
    return this.bioService.deleteProfile(req.user.username, req.user.dbPassword);
  }
}
