import 'server-only';
import { backendMode, createInvestorEndpoint } from '@/features/ai/server/entry';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Default disabled; development-only scripted/mock modes. No live adapter is wired here.
export const POST = createInvestorEndpoint(() => backendMode());
