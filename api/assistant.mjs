import { handleAssistant } from '../server/assistant.mjs';
export default { fetch: request => handleAssistant(request, { clientIp: request.headers.get('x-vercel-forwarded-for') || 'unknown' }) };
