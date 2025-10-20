/**
 * Metrics API Service
 *
 * Handles sending performance metrics to the backend API
 * and retrieving historical metrics data
 */

import { supabase } from '@/lib/supabase';
import { PerformanceReport } from './performanceMonitor';

export interface PerformanceMetricRecord {
  metric_type: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  device_type?: string;
  os_type?: string;
  browser_type?: string;
  page_url?: string;
  action_name?: string;
  success?: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface SessionSummaryRecord {
  session_id: string;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  user_role?: string;
  device_type?: string;
  total_events: number;
  error_count: number;
  warning_count: number;
  rage_pattern_count: number;
  fcp_ms?: number;
  lcp_ms?: number;
  cls_score?: number;
  fid_ms?: number;
  inp_ms?: number;
  slow_actions_count: number;
  failed_actions_count: number;
  sync_conflicts: number;
  offline_events: number;
  full_report: any;
}

export class MetricsApiService {
  private static instance: MetricsApiService;

  private constructor() {}

  static getInstance(): MetricsApiService {
    if (!MetricsApiService.instance) {
      MetricsApiService.instance = new MetricsApiService();
    }
    return MetricsApiService.instance;
  }

  /**
   * Send performance report to backend
   */
  async sendPerformanceReport(report: PerformanceReport, licenseKey: string): Promise<boolean> {
    try {
      // Extract metrics and create records
      const metricRecords = this.extractMetricRecords(report);
      const sessionSummary = this.createSessionSummary(report, licenseKey);

      // Insert individual metrics
      if (metricRecords.length > 0) {
        const { error: metricsError } = await supabase
          .from('performance_metrics')
          .insert(metricRecords);

        if (metricsError) {
          console.error('Failed to insert metrics:', metricsError);
          return false;
        }
      }

      // Insert session summary
      const { error: summaryError } = await supabase
        .from('performance_session_summaries')
        .insert([sessionSummary]);

      if (summaryError) {
        console.error('Failed to insert session summary:', summaryError);
        return false;
      }

      console.debug('✅ Performance metrics saved successfully');
      return true;
    } catch (error) {
      console.error('Error sending performance report:', error);
      return false;
    }
  }

  /**
   * Extract individual metric records from report
   */
  private extractMetricRecords(report: PerformanceReport): PerformanceMetricRecord[] {
    const records: PerformanceMetricRecord[] = [];

    report.metrics.forEach((metric: any) => {
      records.push({
        metric_type: this.categorizeMetric(metric.name),
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit,
        device_type: report.deviceTier,
        os_type: this.extractOSType(),
        browser_type: this.extractBrowserType(),
        page_url: report.pageUrl,
        action_name: metric.metadata?.action,
        success: metric.metadata?.status === 'success',
        error_message: metric.metadata?.error,
        metadata: metric.metadata,
      });
    });

    return records;
  }

  /**
   * Create session summary record
   */
  private createSessionSummary(
    report: PerformanceReport,
    _licenseKey: string
  ): SessionSummaryRecord {
    // Calculate statistics
    const errorMetrics = report.metrics.filter((m: any) => m.name.includes('error'));
    const warningMetrics = report.metrics.filter((m: any) => m.name.includes('warning'));
    const rageMetrics = report.metrics.filter((m: any) => m.name.includes('rage'));
    const slowActions = report.metrics.filter((m: any) => {
      if (m.name.includes('action') && m.value > 1000) return true;
      return false;
    });
    const failedActions = report.metrics.filter(
      (m: any) => m.metadata?.status === 'error' || m.metadata?.success === false
    );

    // Extract Web Vitals
    const fcp = report.metrics.find((m: any) => m.name === 'web_vital.fcp');
    const lcp = report.metrics.find((m: any) => m.name === 'web_vital.lcp');
    const cls = report.metrics.find((m: any) => m.name === 'web_vital.cls');
    const fid = report.metrics.find((m: any) => m.name === 'web_vital.fid');
    const inp = report.metrics.find((m: any) => m.name === 'web_vital.inp');

    return {
      session_id: report.sessionId,
      start_time: new Date(Date.now() - report.duration).toISOString(),
      end_time: new Date().toISOString(),
      duration_ms: Math.round(report.duration),
      user_role: 'admin', // This would come from auth context in real scenario
      device_type: report.deviceTier,
      total_events: report.metrics.length,
      error_count: errorMetrics.length,
      warning_count: warningMetrics.length,
      rage_pattern_count: rageMetrics.length,
      fcp_ms: fcp?.value,
      lcp_ms: lcp?.value,
      cls_score: cls?.value,
      fid_ms: fid?.value,
      inp_ms: inp?.value,
      slow_actions_count: slowActions.length,
      failed_actions_count: failedActions.length,
      sync_conflicts: report.metrics.filter((m: any) => m.name.includes('sync_conflict')).length,
      offline_events: report.metrics.filter((m: any) => m.metadata?.offline === true).length,
      full_report: report,
    };
  }

  /**
   * Categorize metric by name
   */
  private categorizeMetric(metricName: string): string {
    if (metricName.includes('web_vital')) return 'web_vital';
    if (metricName.includes('navigation')) return 'navigation';
    if (metricName.includes('resource')) return 'resource';
    if (metricName.includes('action')) return 'action';
    if (metricName.includes('error')) return 'error';
    if (metricName.includes('rage')) return 'rage';
    return 'other';
  }

  /**
   * Get historical metrics for a show
   */
  async getShowMetrics(
    licenseKey: string,
    days: number = 7
  ): Promise<SessionSummaryRecord[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('performance_session_summaries')
        .select('*')
        .eq('license_key', licenseKey)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch metrics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching show metrics:', error);
      return [];
    }
  }

  /**
   * Get metrics for a specific session
   */
  async getSessionMetrics(sessionId: string): Promise<PerformanceMetricRecord[]> {
    try {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('session_id', sessionId)
        .order('event_timestamp', { ascending: false });

      if (error) {
        console.error('Failed to fetch session metrics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching session metrics:', error);
      return [];
    }
  }

  /**
   * Get error statistics for a show
   */
  async getErrorStats(licenseKey: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('performance_metrics')
        .select('error_message, metric_name, count(*)')
        .eq('license_key', licenseKey)
        .gte('created_at', startDate.toISOString())
        .eq('metric_type', 'error')
        .order('count', { ascending: false });

      if (error) {
        console.error('Failed to fetch error stats:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching error stats:', error);
      return [];
    }
  }

  /**
   * Get device performance statistics
   */
  async getDeviceStats(licenseKey: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('performance_metrics')
        .select('device_type, metric_name, metric_value')
        .eq('license_key', licenseKey)
        .gte('created_at', startDate.toISOString())
        .in('metric_type', ['web_vital', 'action']);

      if (error) {
        console.error('Failed to fetch device stats:', error);
        return [];
      }

      // Aggregate by device type
      const aggregated = this.aggregateByDeviceType(data || []);
      return aggregated;
    } catch (error) {
      console.error('Error fetching device stats:', error);
      return [];
    }
  }

  /**
   * Aggregate metrics by device type
   */
  private aggregateByDeviceType(metrics: any[]): any[] {
    const aggregated: Record<string, any> = {};

    metrics.forEach((m) => {
      if (!aggregated[m.device_type]) {
        aggregated[m.device_type] = {
          device_type: m.device_type,
          avg_fcp: 0,
          avg_lcp: 0,
          error_count: 0,
          session_count: 0,
        };
      }

      if (m.metric_name === 'web_vital.fcp') {
        aggregated[m.device_type].avg_fcp = m.metric_value;
      }
      if (m.metric_name === 'web_vital.lcp') {
        aggregated[m.device_type].avg_lcp = m.metric_value;
      }
    });

    return Object.values(aggregated);
  }

  /**
   * Get venue-specific statistics (if show data includes venue info)
   */
  async getVenueStats(licenseKey: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: sessions, error } = await supabase
        .from('performance_session_summaries')
        .select('*')
        .eq('license_key', licenseKey)
        .gte('created_at', startDate.toISOString());

      if (error) {
        console.error('Failed to fetch venue stats:', error);
        return [];
      }

      // Group by performance issues
      return {
        total_sessions: sessions?.length || 0,
        high_error_sessions: sessions?.filter((s: any) => s.error_count > 5).length || 0,
        offline_heavy_sessions: sessions?.filter((s: any) => s.offline_events > 10).length || 0,
        sync_conflict_sessions: sessions?.filter((s: any) => s.sync_conflicts > 0).length || 0,
        avg_duration_ms: sessions
          ? Math.round(
              sessions.reduce((sum: number, s: any) => sum + (s.duration_ms || 0), 0) /
                sessions.length
            )
          : 0,
      };
    } catch (error) {
      console.error('Error fetching venue stats:', error);
      return {};
    }
  }


  /**
   * Export metrics as CSV
   */
  async exportMetricsAsCSV(licenseKey: string, days: number = 7): Promise<string> {
    try {
      const sessions = await this.getShowMetrics(licenseKey, days);

      const headers = [
        'Session ID',
        'Start Time',
        'Duration (ms)',
        'Device Type',
        'Total Events',
        'Errors',
        'Warnings',
        'FCP (ms)',
        'LCP (ms)',
        'CLS Score',
        'Sync Conflicts',
      ];

      const rows = sessions.map((s: any) => [
        s.session_id,
        s.start_time,
        s.duration_ms,
        s.device_type,
        s.total_events,
        s.error_count,
        s.warning_count,
        s.fcp_ms?.toFixed(0) || '-',
        s.lcp_ms?.toFixed(0) || '-',
        s.cls_score?.toFixed(3) || '-',
        s.sync_conflicts,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(',')),
      ].join('\n');

      return csv;
    } catch (error) {
      console.error('Error exporting metrics:', error);
      return '';
    }
  }

  // Helper methods

  private extractOSType(): string {
    const ua = navigator.userAgent;
    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'MacOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('like Mac') > -1) return 'iOS';
    return 'Unknown';
  }

  private extractBrowserType(): string {
    const ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    return 'Unknown';
  }
}

export const metricsApiService = MetricsApiService.getInstance();
