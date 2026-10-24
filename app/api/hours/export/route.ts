import {withGuestRequestAudit} from '@/lib/review-request-audit';
import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireActor } from '@/lib/auth';
import { ErpError, snapshot } from '@/lib/erp';
import { buildWorkLogReport, parseWorkLogSelection, workLogCsv } from '@/lib/work-log-report';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const privateHeaders = { 'Cache-Control': 'private, no-store', 'Pragma': 'no-cache', 'X-Content-Type-Options': 'nosniff' };

async function handleGET(request: NextRequest) {
  try {
    const actor = await requireActor(request);
    if (!['admin', 'staff', 'vendor'].includes(actor.role)) throw new AuthError('Work-log exports are available to the TAYCO team and the submitting supplier only.', 403);
    const query = request.nextUrl.searchParams;
    for (const key of ['from', 'to', 'projectId', 'status', 'format']) if (query.getAll(key).length > 1) throw new RangeError('Use one value for each reporting filter.');
    const format = query.get('format') || 'csv';
    if (!['csv', 'json'].includes(format)) throw new RangeError('Choose CSV or JSON for the report.');
    const selection = parseWorkLogSelection({ from: query.get('from'), to: query.get('to'), projectId: query.get('projectId'), status: query.get('status') });
    const current = snapshot(actor);
    if (selection.projectId && !current.entries.some(entry => entry.kind === 'project' && entry.id === selection.projectId)) throw new ErpError(404, 'Project not found in your current access.');
    // Keep the supplier boundary explicit even if the snapshot implementation evolves.
    const entries = actor.role === 'vendor' ? current.entries.filter(entry => entry.kind === 'project' || (entry.kind === 'hours' && entry.ownerId === actor.id)) : current.entries;
    const report = buildWorkLogReport(entries, { ...selection, asOf: current.updatedAt });
    const reportHeaders = { ...privateHeaders, 'X-TAYCO-Excluded-Records': String(report.excludedRecordCount), 'X-TAYCO-Source-Notices': String(report.warnings.length) };
    if (format === 'json') return NextResponse.json({ success: true, report }, { headers: { ...reportHeaders, 'Content-Disposition': 'attachment; filename="tayco-recorded-hours.json"' } });
    return new NextResponse(workLogCsv(report), { headers: { ...reportHeaders, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="tayco-recorded-hours.csv"' } });
  } catch (error) {
    if (error instanceof AuthError || error instanceof ErpError) return NextResponse.json({ success: false, error: error.message }, { status: error.status, headers: privateHeaders });
    if (error instanceof RangeError) return NextResponse.json({ success: false, error: error.message }, { status: 422, headers: privateHeaders });
    return NextResponse.json({ success: false, error: 'The work-log export is unavailable. Try again later.' }, { status: 503, headers: privateHeaders });
  }
}

export const GET=withGuestRequestAudit('workspace',handleGET);
