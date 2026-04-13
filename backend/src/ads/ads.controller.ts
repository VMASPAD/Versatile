import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { AdsService } from './ads.service';
import type { CreateAdDto, UpdateAdDto } from './ads.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req: any) {
    return this.adsService.findAll(req.user.username, req.user.dbPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.adsService.findOne(req.user.username, req.user.dbPassword, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() body: CreateAdDto) {
    return this.adsService.create(req.user.username, req.user.dbPassword, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: UpdateAdDto) {
    return this.adsService.update(req.user.username, req.user.dbPassword, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.adsService.remove(req.user.username, req.user.dbPassword, id);
  }
}
