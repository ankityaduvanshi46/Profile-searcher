import { AgentName, JobStep, SearchFilters, SearchJob } from "../types";
import { kv } from "../storage/kv";
import { DiscoveryAgent } from "./discovery-agent";
import { MetricsAgent } from "./metrics-agent";
import { BioFilterAgent } from "./bio-filter-agent";
import { RankingAgent } from "./ranking-agent";
import { DeduplicationAgent } from "./dedup-agent";
import { SheetsWriterAgent } from "./sheets-agent";

const JOB_PREFIX = "job:";
const JOB_LIST_KEY = "jobs_list_index";

export class Orchestrator {
  private discoveryAgent = new DiscoveryAgent();
  private metricsAgent = new MetricsAgent();
  private bioFilterAgent = new BioFilterAgent();
  private rankingAgent = new RankingAgent();
  private dedupAgent = new DeduplicationAgent();
  private sheetsAgent = new SheetsWriterAgent();

  async createJob(filters: SearchFilters): Promise<SearchJob> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const emptyAgents: Record<AgentName, any> = {
      discovery: { name: "discovery", status: "idle", message: "Pending initialization", processedCount: 0, totalCount: 0 },
      metrics: { name: "metrics", status: "idle", message: "Awaiting candidates", processedCount: 0, totalCount: 0 },
      bio_filter: { name: "bio_filter", status: "idle", message: "Awaiting metrics validation", processedCount: 0, totalCount: 0 },
      ranking: { name: "ranking", status: "idle", message: "Awaiting filtered candidates", processedCount: 0, totalCount: 0 },
      deduplication: { name: "deduplication", status: "idle", message: "Awaiting ranked profiles", processedCount: 0, totalCount: 0 },
      sheets_writer: { name: "sheets_writer", status: "idle", message: "Awaiting unique profiles", processedCount: 0, totalCount: 0 }
    };

    const job: SearchJob = {
      id,
      createdAt: now,
      updatedAt: now,
      status: "queued",
      currentStep: "init",
      filters,
      agents: emptyAgents,
      candidateProfiles: [],
      profileDetails: [],
      acceptedProfiles: [],
      rejectedProfiles: [],
      rankedProfiles: [],
      writtenProfiles: []
    };

    await kv.set(`${JOB_PREFIX}${id}`, job, { ex: 60 * 60 * 24 * 7 });

    const jobIndex = (await kv.get<string[]>(JOB_LIST_KEY)) || [];
    await kv.set(JOB_LIST_KEY, [id, ...jobIndex.filter((j) => j !== id)].slice(0, 50));

    return job;
  }

  async getJob(id: string): Promise<SearchJob | null> {
    return await kv.get<SearchJob>(`${JOB_PREFIX}${id}`);
  }

  async listJobs(): Promise<SearchJob[]> {
    const ids = (await kv.get<string[]>(JOB_LIST_KEY)) || [];
    const jobs: SearchJob[] = [];
    for (const id of ids) {
      const job = await this.getJob(id);
      if (job) jobs.push(job);
    }
    return jobs;
  }

  async executeStep(id: string): Promise<SearchJob> {
    const job = await this.getJob(id);
    if (!job) {
      throw new Error(`Job ${id} not found`);
    }

    if (job.status === "completed" || job.status === "failed") {
      return job;
    }

    const now = new Date().toISOString();
    job.updatedAt = now;
    job.status = "running";

    try {
      if (job.currentStep === "init") {
        job.currentStep = "discovery";
        job.agents.discovery.status = "running";
        job.agents.discovery.startedAt = now;
        job.agents.discovery.message = `Searching via ${job.filters.hashtag ? `#${job.filters.hashtag}` : job.filters.niche}...`;
        await kv.set(`${JOB_PREFIX}${id}`, job);
        return job;
      }

      if (job.currentStep === "discovery") {
        const candidates = await this.discoveryAgent.execute(job.filters);
        job.candidateProfiles = candidates;
        job.agents.discovery.status = "completed";
        job.agents.discovery.completedAt = new Date().toISOString();
        job.agents.discovery.processedCount = candidates.length;
        job.agents.discovery.totalCount = candidates.length;
        job.agents.discovery.message = `Discovered ${candidates.length} candidate profiles`;

        job.currentStep = "metrics";
        job.agents.metrics.status = "running";
        job.agents.metrics.startedAt = new Date().toISOString();
        job.agents.metrics.totalCount = candidates.length;
        job.agents.metrics.message = `Evaluating metrics for ${candidates.length} candidates`;
        await kv.set(`${JOB_PREFIX}${id}`, job);
        return job;
      }

      if (job.currentStep === "metrics") {
        const metricsResult = await this.metricsAgent.execute(job.candidateProfiles, job.filters);
        job.profileDetails = metricsResult.accepted;
        job.rejectedProfiles = [...job.rejectedProfiles, ...metricsResult.rejected];
        job.agents.metrics.status = "completed";
        job.agents.metrics.completedAt = new Date().toISOString();
        job.agents.metrics.processedCount = metricsResult.accepted.length;
        job.agents.metrics.message = `${metricsResult.accepted.length} profiles met followers/reels criteria (${metricsResult.rejected.length} filtered)`;

        job.currentStep = "bio_filter";
        job.agents.bio_filter.status = "running";
        job.agents.bio_filter.startedAt = new Date().toISOString();
        job.agents.bio_filter.totalCount = metricsResult.accepted.length;
        job.agents.bio_filter.message = "Analyzing biographies for agency & manager mentions";
        await kv.set(`${JOB_PREFIX}${id}`, job);
        return job;
      }

      if (job.currentStep === "bio_filter") {
        const bioResult = this.bioFilterAgent.execute(job.profileDetails, job.filters);
        job.acceptedProfiles = bioResult.accepted;
        job.rejectedProfiles = [...job.rejectedProfiles, ...bioResult.rejected];
        job.agents.bio_filter.status = "completed";
        job.agents.bio_filter.completedAt = new Date().toISOString();
        job.agents.bio_filter.processedCount = bioResult.accepted.length;
        job.agents.bio_filter.message = `${bioResult.accepted.length} independent creators verified (${bioResult.rejected.length} managed)`;

        job.currentStep = "ranking";
        job.agents.ranking.status = "running";
        job.agents.ranking.startedAt = new Date().toISOString();
        job.agents.ranking.totalCount = bioResult.accepted.length;
        job.agents.ranking.message = "Computing multi-factor performance scores";
        await kv.set(`${JOB_PREFIX}${id}`, job);
        return job;
      }

      if (job.currentStep === "ranking") {
        const ranked = this.rankingAgent.execute(job.acceptedProfiles, job.filters);
        job.rankedProfiles = ranked;
        job.agents.ranking.status = "completed";
        job.agents.ranking.completedAt = new Date().toISOString();
        job.agents.ranking.processedCount = ranked.length;
        job.agents.ranking.totalCount = ranked.length;
        job.agents.ranking.message = `Ranked ${ranked.length} creators by reach and engagement`;

        job.currentStep = "deduplication";
        job.agents.deduplication.status = "running";
        job.agents.deduplication.startedAt = new Date().toISOString();
        job.agents.deduplication.totalCount = ranked.length;
        job.agents.deduplication.message = "Cross-referencing historical records and sheets database";
        await kv.set(`${JOB_PREFIX}${id}`, job);
        return job;
      }

      if (job.currentStep === "deduplication") {
        const dedupResult = await this.dedupAgent.execute(job.rankedProfiles);
        job.rankedProfiles = dedupResult.uniqueProfiles;
        job.rejectedProfiles = [...job.rejectedProfiles, ...dedupResult.duplicateProfiles];
        job.agents.deduplication.status = "completed";
        job.agents.deduplication.completedAt = new Date().toISOString();
        job.agents.deduplication.processedCount = dedupResult.uniqueProfiles.length;
        job.agents.deduplication.message = `${dedupResult.uniqueProfiles.length} new unique profiles identified (${dedupResult.duplicateProfiles.length} duplicates skipped)`;

        job.currentStep = "sheets_writer";
        job.agents.sheets_writer.status = "running";
        job.agents.sheets_writer.startedAt = new Date().toISOString();
        job.agents.sheets_writer.totalCount = dedupResult.uniqueProfiles.length;
        job.agents.sheets_writer.message = "Syncing structured results to Google Sheets";
        await kv.set(`${JOB_PREFIX}${id}`, job);
        return job;
      }

      if (job.currentStep === "sheets_writer") {
        const sheetsResult = await this.sheetsAgent.execute(job.rankedProfiles);
        job.writtenProfiles = job.rankedProfiles;
        await this.dedupAgent.markAsRecorded(job.rankedProfiles.map((p) => p.username));

        job.agents.sheets_writer.status = "completed";
        job.agents.sheets_writer.completedAt = new Date().toISOString();
        job.agents.sheets_writer.processedCount = sheetsResult.appendedCount;
        job.agents.sheets_writer.message = `Successfully appended ${sheetsResult.appendedCount} rows to Google Sheet`;

        job.currentStep = "done";
        job.status = "completed";
        const start = new Date(job.createdAt).getTime();
        job.totalExecutionTimeMs = Date.now() - start;
        await kv.set(`${JOB_PREFIX}${id}`, job);
        return job;
      }

      return job;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Orchestration step failed";
      job.status = "failed";
      job.error = message;
      const current = job.currentStep as AgentName;
      if (job.agents[current]) {
        job.agents[current].status = "failed";
        job.agents[current].error = message;
      }
      await kv.set(`${JOB_PREFIX}${id}`, job);
      return job;
    }
  }
}

export const orchestrator = new Orchestrator();
