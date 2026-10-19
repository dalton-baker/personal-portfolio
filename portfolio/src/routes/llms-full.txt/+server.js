import { llmsFullTxt } from '$lib/server/agents.js';

export const prerender = true;

export function GET() {
	return new Response(llmsFullTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
