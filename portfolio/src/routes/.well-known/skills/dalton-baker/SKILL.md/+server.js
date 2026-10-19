import { skillMd } from '$lib/server/agents.js';

export const prerender = true;

export function GET() {
	return new Response(skillMd(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
