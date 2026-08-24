import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { DataSource, Repository } from 'typeorm';
import {
  WebsiteCrawlPayloadDto,
  WebsiteStatusPayloadDto,
} from './dto/website-crawl.dto';
import { MerchantComplianceSnapshot } from './entities/merchant-compliance-snapshot.entity';
import { WebsiteCrawlLog } from './entities/website-crawl-log.entity';
import { crawlWebsite, MerchantProfile } from './website-crawl.logic';

type MerchantRow = {
  client_id: string;
  legal_name: string | null;
  trade_name: string | null;
  merchant_profile: Record<string, unknown> | null;
  email: string | null;
  mobile: string | null;
  company_name: string | null;
};

@Injectable()
export class WebsiteCrawlService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(WebsiteCrawlLog)
    private readonly crawlLogRepository: Repository<WebsiteCrawlLog>,
    @InjectRepository(MerchantComplianceSnapshot)
    private readonly snapshotRepository: Repository<MerchantComplianceSnapshot>,
  ) {}

  async crawl(payload: WebsiteCrawlPayloadDto) {
    try {
      const merchant = await this.requireMerchant(payload.clientId);
      const result = await crawlWebsite({
        merchantId: payload.clientId,
        websiteUrl: payload.websiteUrl,
        merchant: this.toMerchantProfile(merchant),
      });

      const log = this.crawlLogRepository.create({
        client_id: payload.clientId,
        log_id: result.latestCrawl.logId,
        website_url: payload.websiteUrl,
        domain: result.latestCrawl.domain,
        ssl_status: result.latestCrawl.sslStatus,
        domain_age: result.latestCrawl.domainAge ?? null,
        contact_info: result.latestCrawl.contactInfoExtracted,
        compliance_flags: result.latestCrawl.complianceFlags,
        business_match: result.latestCrawl.businessMatch,
        anomalies: result.latestCrawl.anomalies,
        policies_found: result.latestCrawl.policiesFound,
        website_score: result.websiteScore,
        score_breakdown: result.latestCrawl.scoreBreakdown,
        raw_response: result.latestCrawl.rawResponse,
        crawled_at: result.latestCrawl.crawledAt,
      });
      await this.crawlLogRepository.save(log);

      let snapshot = await this.snapshotRepository.findOne({
        where: { client_id: payload.clientId },
      });
      if (!snapshot) {
        snapshot = this.snapshotRepository.create({
          client_id: payload.clientId,
        });
      }
      snapshot.website_score = result.websiteScore;
      snapshot.latest_log_id = result.latestCrawl.logId;
      snapshot.latest_crawl = result.latestCrawl;
      await this.snapshotRepository.save(snapshot);

      return result;
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  async getStatus(payload: WebsiteStatusPayloadDto) {
    try {
      await this.requireMerchant(payload.clientId);

      const latest = await this.crawlLogRepository.findOne({
        where: { client_id: payload.clientId },
        order: { crawled_at: 'DESC' },
      });

      if (!latest) {
        return {
          merchantId: payload.clientId,
          latestCrawl: null,
          crawlHistory: [],
          totalCount: 0,
          websiteScore: 0,
          alerts: [],
        };
      }

      const response: Record<string, unknown> = {
        merchantId: payload.clientId,
        latestCrawl: this.toCrawlResponse(latest),
        websiteScore: latest.website_score,
        alerts: [],
      };

      if (payload.includeHistory) {
        const history = await this.crawlLogRepository.find({
          where: { client_id: payload.clientId },
          order: { crawled_at: 'DESC' },
        });
        response.crawlHistory = history.map((row) => this.toCrawlResponse(row));
        response.totalCount = history.length;
      }

      return response;
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  private async requireMerchant(clientId: string): Promise<MerchantRow> {
    const rows = (await this.dataSource.query(
      `SELECT m.client_id, m.legal_name, m.trade_name, m.merchant_profile,
              i.email, i.mobile, i.company_name
       FROM merchants m
       LEFT JOIN merchant_invites i ON i.client_id = m.client_id
       WHERE m.client_id = $1 AND m.status <> 'deleted'
       LIMIT 1`,
      [clientId],
    )) as MerchantRow[];

    if (!rows[0]) {
      throw new NotFoundException(`Merchant not found for clientId ${clientId}`);
    }

    return rows[0];
  }

  private toMerchantProfile(row: MerchantRow): MerchantProfile {
    const profile = row.merchant_profile ?? {};
    const business = (profile.business ?? {}) as Record<string, unknown>;
    const contact = (profile.contact ?? {}) as Record<string, unknown>;
    const address =
      asString(business.address) ||
      asString(business.registeredAddress) ||
      asString(profile.address);

    return {
      companyName:
        row.legal_name || row.trade_name || row.company_name || undefined,
      address: address || undefined,
      email: row.email || asString(contact.email) || undefined,
      mobile: row.mobile || asString(contact.mobile) || undefined,
    };
  }

  private toCrawlResponse(row: WebsiteCrawlLog) {
    return {
      logId: row.log_id,
      merchantId: row.client_id,
      domain: row.domain,
      websiteUrl: row.website_url,
      sslStatus: row.ssl_status,
      domainAge: row.domain_age ?? undefined,
      contactInfoExtracted: row.contact_info,
      complianceFlags: row.compliance_flags,
      businessMatch: row.business_match,
      anomalies: row.anomalies,
      policiesFound: row.policies_found,
      websiteScore: row.website_score,
      scoreBreakdown: row.score_breakdown,
      crawledAt: row.crawled_at,
      rawResponse: row.raw_response,
    };
  }

  private toRpcException(error: unknown): RpcException {
    if (error instanceof RpcException) {
      return error;
    }

    if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();
      if (typeof response === 'object' && response !== null) {
        return new RpcException({
          ...(response as Record<string, unknown>),
          statusCode:
            (response as { statusCode?: number }).statusCode ?? status,
        });
      }
      return new RpcException({
        statusCode: status,
        message: response,
        error: error.name,
      });
    }

    const message = error instanceof Error ? error.message : 'Website crawl failed';
    const isRobots = /robots\.txt/i.test(message);
    const isUrl = error instanceof TypeError || /Invalid URL/i.test(message);

    return new RpcException({
      statusCode: isRobots || isUrl ? 400 : 500,
      message,
      error: isRobots || isUrl ? 'Bad Request' : 'Internal Server Error',
    });
  }
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
