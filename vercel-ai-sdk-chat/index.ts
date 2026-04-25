/**
 * Vercel AI SDK + Chronary toolkit — terminal chat.
 *
 * The toolkit's `/ai-sdk` adapter returns Chronary's 23 calendar tools as a
 * `Record<string, Tool>` that drops straight into `generateText({ tools })`.
 * `maxSteps: 5` lets the model chain `list_calendars` → `check_availability`
 * → `create_event` in a single user turn.
 */

import { createInterface } from 'node:readline/promises';
import { generateText, type CoreMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { chronaryTools } from '@chronary/toolkit/ai-sdk';

const chronaryApiKey = process.env.CHRONARY_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!chronaryApiKey) throw new Error('CHRONARY_API_KEY is not set');
if (!openaiApiKey) throw new Error('OPENAI_API_KEY is not set');

const tools = chronaryTools({ apiKey: chronaryApiKey });

const messages: CoreMessage[] = [
  {
    role: 'system',
    content:
      'You are a calendar scheduling assistant. Use the Chronary tools to read and write calendar data on the user\'s behalf. Confirm event details before creating them.',
  },
];

const rl = createInterface({ input: process.stdin, output: process.stdout });
console.log('Chronary scheduling chat. Type "exit" to quit.\n');

while (true) {
  const userInput = (await rl.question('you ▸ ')).trim();
  if (!userInput || userInput === 'exit') break;
  messages.push({ role: 'user', content: userInput });

  const result = await generateText({
    model: openai('gpt-4o'),
    tools,
    messages,
    maxSteps: 5,
  });

  console.log(`bot ▸ ${result.text}\n`);
  messages.push({ role: 'assistant', content: result.text });
}

rl.close();
