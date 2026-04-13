import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

import * as net from 'net';

const SARYCHDB_HOST = '127.0.0.1';
const SARYCHDB_PORT = parseInt(process.env.SARYCHDB_PORT || '4040', 10);

// Internal system account for the ad registry (public ad lookups)
const SYSTEM_USER = '_versatile_system';
const SYSTEM_PASS = process.env.VERSATILE_SYSTEM_KEY || 'v3rs4t1l3_int3rn4l_k3y';

export interface SarychResponse {
  [key: string]: any;
}

@Injectable()
export class SarychDBService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SarychDBService.name);

  async onModuleInit() {
    await this.waitForReady();
    await this.ensureSystemUser();
  }

  async onModuleDestroy() { }

  /** Ensure the internal system user + registry db exist */
  private async ensureSystemUser() {
    try {
      await this.createUser(SYSTEM_USER, SYSTEM_PASS, 'registry');
      this.logger.log('System user created');
    } catch (e: any) {
      if (e.message?.includes('already') || e.message?.includes('exists')) {
        this.logger.log('System user already exists');
      } else {
        this.logger.warn(`System user setup: ${e.message}`);
        // User may already exist but registry db might not
        try {
          await this.createDb(SYSTEM_USER, SYSTEM_PASS, 'registry');
        } catch (_) { }
      }
    }

    // Ensure all registry databases exist
    const registryDbs = ['registry_fly', 'registry_bio'];
    for (const db of registryDbs) {
      try {
        await this.createDb(SYSTEM_USER, SYSTEM_PASS, db);
        this.logger.log(`Registry database "${db}" created`);
      } catch (e: any) {
        if (e.message?.includes('already') || e.message?.includes('exists')) {
          this.logger.log(`Registry database "${db}" already exists`);
        } else {
          this.logger.warn(`Registry database "${db}" setup: ${e.message}`);
        }
      }
    }
  }

  private async waitForReady(retries = 30, delayMs = 1000): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.send({ url: 'sarychdb://nobody@nopass/default/health' });
        this.logger.log('SarychDB TCP is ready');
        return;
      } catch (e) {
        // failed
      }
      this.logger.log(`Waiting for SarychDB TCP... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
    throw new Error('SarychDB failed to become ready over TCP');
  }

  private buildUrl(username: string, password: string, database: string, operation: string): string {
    return `sarychdb://${username}@${password}/${database}/${operation}`;
  }

  async send(payload: Record<string, any>): Promise<SarychResponse> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.connect(SARYCHDB_PORT, SARYCHDB_HOST, () => {
        client.write(JSON.stringify(payload) + '\n');
      });

      let responseData = '';
      client.on('data', (data) => {
        responseData += data.toString();
        if (responseData.includes('\n')) {
          client.destroy();
        }
      });

      client.on('close', () => {
        try {
          const trimmed = responseData.trim();
          if (!trimmed) {
            return reject(new Error('Empty response from SarychDB'));
          }
          const res = JSON.parse(trimmed);
          if (res.error) {
            return reject(new Error(`SarychDB error: ${res.error}`));
          }
          resolve(res);
        } catch (err) {
          reject(new Error(`Failed to parse SarychDB response: ${responseData}`));
        }
      });

      client.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Wrapper that auto-creates the database if SarychDB reports it doesn't exist,
   * then retries the original operation once.
   */
  private async sendWithAutoCreate(
    username: string,
    password: string,
    database: string,
    payload: Record<string, any>,
  ): Promise<SarychResponse> {
    try {
      return await this.send(payload);
    } catch (err: any) {
      if (err.message?.includes('Database does not exist') || err.message?.includes('not found')) {
        this.logger.log(`Database "${database}" not found for user "${username}", creating it...`);
        await this.createDb(username, password, database);
        return this.send(payload);
      }
      throw err;
    }
  }

  // ---- User / DB management ----

  async createUser(username: string, password: string, database?: string): Promise<SarychResponse> {
    const db = database || 'default';
    return this.send({
      url: this.buildUrl(username, password, db, 'create_user'),
    });
  }

  async createDb(username: string, password: string, database: string): Promise<SarychResponse> {
    return this.send({
      url: this.buildUrl(username, password, database, 'create_db'),
    });
  }

  // ---- CRUD ----

  async post(username: string, password: string, database: string, body: Record<string, any>): Promise<SarychResponse> {
    return this.sendWithAutoCreate(username, password, database, {
      url: this.buildUrl(username, password, database, 'post'),
      body,
    });
  }

  async get(username: string, password: string, database: string, query: string, queryType?: string): Promise<SarychResponse> {
    return this.sendWithAutoCreate(username, password, database, {
      url: this.buildUrl(username, password, database, `get?query=${encodeURIComponent(query)}`),
      ...(queryType && { queryType }),
    });
  }

  async browse(username: string, password: string, database: string, page?: number, limit?: number): Promise<SarychResponse> {
    return this.sendWithAutoCreate(username, password, database, {
      url: this.buildUrl(username, password, database, 'browse'),
      ...(page && { page }),
      ...(limit && { limit }),
    });
  }

  async list(
    username: string,
    password: string,
    database: string,
    options?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string; filters?: Record<string, any> },
  ): Promise<SarychResponse> {
    return this.sendWithAutoCreate(username, password, database, {
      url: this.buildUrl(username, password, database, 'list'),
      ...options,
    });
  }

  async put(username: string, password: string, database: string, query: string, body: Record<string, any>): Promise<SarychResponse> {
    return this.sendWithAutoCreate(username, password, database, {
      url: this.buildUrl(username, password, database, `put?query=${encodeURIComponent(query)}`),
      body,
    });
  }

  async edit(username: string, password: string, database: string, body: Record<string, any>): Promise<SarychResponse> {
    return this.sendWithAutoCreate(username, password, database, {
      url: this.buildUrl(username, password, database, 'edit'),
      body,
    });
  }

  async deleteByQuery(username: string, password: string, database: string, query: string): Promise<SarychResponse> {
    return this.sendWithAutoCreate(username, password, database, {
      url: this.buildUrl(username, password, database, `delete?query=${encodeURIComponent(query)}`),
    });
  }

  async deleteById(username: string, password: string, database: string, id: string): Promise<SarychResponse> {
    return this.sendWithAutoCreate(username, password, database, {
      url: this.buildUrl(username, password, database, 'delete_by_id'),
      body: { _id: id },
    });
  }

  async stats(username: string, password: string, database: string): Promise<SarychResponse> {
    return this.sendWithAutoCreate(username, password, database, {
      url: this.buildUrl(username, password, database, 'stats'),
    });
  }

  async listDbs(username: string, password: string): Promise<SarychResponse> {
    return this.send({
      url: this.buildUrl(username, password, 'default', 'list_dbs'),
    });
  }

  // ---- Registry (public ad lookup) ----

  /** Register an ad so it can be fetched publicly by ID */
  async registerAd(adId: string, ownerUsername: string, ownerPassword: string): Promise<void> {
    try {
      await this.post(SYSTEM_USER, SYSTEM_PASS, 'registry', {
        adId,
        owner: ownerUsername,
        ownerPass: ownerPassword,
      });
    } catch (e: any) {
      this.logger.error(`Failed to register ad ${adId}: ${e.message}`);
    }
  }

  /** Look up owner credentials for a public ad ID */
  async lookupAd(adId: string): Promise<{ owner: string; ownerPass: string } | null> {
    try {
      const result = await this.get(SYSTEM_USER, SYSTEM_PASS, 'registry', adId);
      const records: any[] = result.results || [];
      const match = records.find((r: any) => r.adId === adId);
      return match ? { owner: match.owner, ownerPass: match.ownerPass } : null;
    } catch {
      return null;
    }
  }

  /** Remove a registry entry when an ad is deleted */
  async unregisterAd(adId: string): Promise<void> {
    try {
      await this.deleteByQuery(SYSTEM_USER, SYSTEM_PASS, 'registry', adId);
    } catch { }
  }

  // ---- Fly Registry ----
  async registerFly(slug: string, ownerUsername: string, ownerPassword: string): Promise<void> {
    try {
      await this.post(SYSTEM_USER, SYSTEM_PASS, 'registry_fly', {
        slug,
        owner: ownerUsername,
        ownerPass: ownerPassword,
      });
    } catch (e: any) {
      this.logger.error(`Failed to register fly slug ${slug}: ${e.message}`);
    }
  }

  async lookupFly(slug: string): Promise<{ owner: string; ownerPass: string } | null> {
    try {
      const result = await this.get(SYSTEM_USER, SYSTEM_PASS, 'registry_fly', slug);
      const records: any[] = result.results || [];
      const match = records.find((r: any) => r.slug === slug);
      return match ? { owner: match.owner, ownerPass: match.ownerPass } : null;
    } catch {
      return null;
    }
  }

  async unregisterFly(slug: string): Promise<void> {
    try {
      await this.deleteByQuery(SYSTEM_USER, SYSTEM_PASS, 'registry_fly', slug);
    } catch { }
  }

  // ---- Bio Registry ----
  async registerBio(username: string, ownerUsername: string, ownerPassword: string): Promise<void> {
    try {
      // Prevent duplicates by trying to remove first
      await this.unregisterBio(username);
      await this.post(SYSTEM_USER, SYSTEM_PASS, 'registry_bio', {
        username,
        owner: ownerUsername,
        ownerPass: ownerPassword,
      });
    } catch (e: any) {
      this.logger.error(`Failed to register bio ${username}: ${e.message}`);
    }
  }

  async lookupBio(username: string): Promise<{ owner: string; ownerPass: string } | null> {
    try {
      const result = await this.get(SYSTEM_USER, SYSTEM_PASS, 'registry_bio', username);
      const records: any[] = result.results || [];
      const match = records.find((r: any) => r.username === username);
      return match ? { owner: match.owner, ownerPass: match.ownerPass } : null;
    } catch {
      return null;
    }
  }

  async unregisterBio(username: string): Promise<void> {
    try {
      await this.deleteByQuery(SYSTEM_USER, SYSTEM_PASS, 'registry_bio', username);
    } catch { }
  }
}