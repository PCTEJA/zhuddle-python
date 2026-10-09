import { handleAssistant } from '../../server/assistant.mjs';
export default (request, context) => handleAssistant(request, { clientIp: context.ip });
export const config = { path: '/api/assistant', rateLimit: { windowLimit: 8, windowSize: 60, aggregateBy: ['ip', 'domain'] } };
