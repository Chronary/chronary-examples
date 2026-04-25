import OpenAI from 'openai';
import { ChronaryToolkit } from '@chronary/toolkit/openai';

const chronaryApiKey = process.env.CHRONARY_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!chronaryApiKey) throw new Error('CHRONARY_API_KEY is not set');
if (!openaiApiKey) throw new Error('OPENAI_API_KEY is not set');

const toolkit = new ChronaryToolkit({ apiKey: chronaryApiKey });
const openai = new OpenAI({ apiKey: openaiApiKey });

const userPrompt =
  process.argv.slice(2).join(' ').trim() ||
  'Find a 30-minute slot tomorrow afternoon and book it as "Deep work" on my default calendar.';

console.log(`> ${userPrompt}\n`);

const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content:
      'You are a calendar scheduling assistant. Use the provided Chronary tools to read and write calendar data. Confirm what you did in plain English at the end.',
  },
  { role: 'user', content: userPrompt },
];

const tools = toolkit.getTools();

for (let step = 0; step < 6; step++) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools,
    tool_choice: 'auto',
  });

  const choice = response.choices[0];
  const message = choice.message;
  messages.push(message);

  if (message.tool_calls && message.tool_calls.length > 0) {
    for (const call of message.tool_calls) {
      const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
      console.log(`  → ${call.function.name}(${JSON.stringify(args)})`);

      const result = await toolkit.execute(call.function.name, args);
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result.result),
      });
    }
    continue;
  }

  console.log(`\n${message.content}`);
  break;
}
