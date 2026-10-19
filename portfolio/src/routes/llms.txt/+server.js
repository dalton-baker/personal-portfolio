import { llmsTxtFile } from '$lib/server/agents.js';

export const prerender = true;

export function GET() {
	return new Response(llmsTxtFile(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
