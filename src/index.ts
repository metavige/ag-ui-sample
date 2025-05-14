// src/index.ts
import { OpenAIAgent } from './openai-agent';

// Create an instance of our agent
const openAIAgent = new OpenAIAgent();

// Example: Set up some initial messages
openAIAgent.messages = [
  {
    id: '1',
    role: 'user',
    content: 'What can you tell me about the Agent User Interaction Protocol?',
  },
];

// Make a request to OpenAI through AG-UI
const run = openAIAgent.runAgent({
  runId: 'run1',
});

// Subscribe to the observable to see events
run.subscribe({
  next: (event) => console.log('Event:', event),
  error: (err) => console.error('Error:', err),
  complete: () => console.log('Stream complete'),
});
