import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { spawn, ChildProcess } from 'child_process';
import { resolve } from 'path';
import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');

let sarychProcess: ChildProcess | null = null;

function startSarychDB(): ChildProcess {
  const binaryPath = resolve(__dirname, '..', 'SarychDB');
  const port = process.env.SARYCHDB_PORT || '4040';

  logger.log(`Starting SarychDB on port ${port}...`);

  const child = spawn(binaryPath, ['--port', port], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  child.stdout?.on('data', (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) logger.log(`[SarychDB] ${msg}`);
  });

  child.stderr?.on('data', (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) logger.warn(`[SarychDB] ${msg}`);
  });

  child.on('error', (err) => {
    logger.error(`SarychDB process error: ${err.message}`);
  });

  child.on('exit', (code, signal) => {
    logger.warn(`SarychDB exited with code=${code} signal=${signal}`);
    sarychProcess = null;
  });

  return child;
}

function gracefulShutdown() {
  if (sarychProcess) {
    logger.log('Shutting down SarychDB...');
    sarychProcess.kill('SIGTERM');
    sarychProcess = null;
  }
}

async function bootstrap() {
  // 1. Start SarychDB in parallel
  sarychProcess = startSarychDB();

  // 2. Start NestJS (SarychDBService.onModuleInit will wait for SarychDB health)
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || /^http:\/\/localhost:\d+$/,
    credentials: true,
  });

  // Handle shutdown
  process.on('SIGINT', () => {
    gracefulShutdown();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    gracefulShutdown();
    process.exit(0);
  });

  const port = process.env.PORT ?? 3514;
  await app.listen(port);
  logger.log(`Versatile API running on http://localhost:${port}`);
}

bootstrap();
