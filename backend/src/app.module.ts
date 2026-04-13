import { Module } from '@nestjs/common';
import { SarychDBModule } from './SarychDB/sarychdb.module';
import { AuthModule } from './auth/auth.module';
import { AdsModule } from './ads/ads.module';
import { TrackerModule } from './tracker/tracker.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { WidgetModule } from './widget/widget.module';
import { BioModule } from './bio/bio.module';
import { FlyModule } from './fly/fly.module';

@Module({
  imports: [
    SarychDBModule,
    AuthModule,
    AdsModule,
    TrackerModule,
    AnalyticsModule,
    WidgetModule,
    BioModule,
    FlyModule,
  ],
})
export class AppModule {}
