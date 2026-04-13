import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SarychDBService } from '../SarychDB';

interface JwtPayload {
  sub: string;
  username: string;
  dbPassword: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly db: SarychDBService,
  ) {}

  async register(username: string, password: string) {
    try {
      // Create user in SarychDB (SarychDB handles bcrypt internally)
      await this.db.createUser(username, password, 'ads');

      // Also create the events database for tracking
      await this.db.createDb(username, password, 'events');

      const token = this.signToken(username, password);

      return { token, user: { username } };
    } catch (error: any) {
      if (error.message?.includes('exists') || error.message?.includes('already')) {
        throw new ConflictException('Username already exists');
      }
      throw error;
    }
  }

  async login(username: string, password: string) {
    try {
      // Try to list databases — if auth fails, SarychDB will reject
      await this.db.listDbs(username, password);

      // Lazily ensure core DBs exist if they failed during a previous interrupted registration
      try { await this.db.createDb(username, password, 'ads'); } catch (e) {}
      try { await this.db.createDb(username, password, 'events'); } catch (e) {}

      const token = this.signToken(username, password);
      return { token, user: { username } };
    } catch (error: any) {
      this.logger.warn(`Login failed for ${username}: ${error.message}`);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async getProfile(username: string, password: string) {
    try {
      const dbs = await this.db.listDbs(username, password);
      return { username, databases: dbs };
    } catch {
      throw new UnauthorizedException('Invalid session');
    }
  }

  private signToken(username: string, password: string): string {
    const payload: JwtPayload = {
      sub: username,
      username,
      dbPassword: password,
    };
    return this.jwt.sign(payload);
  }
}
