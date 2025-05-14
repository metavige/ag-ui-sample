// src/index.ts
import { CustomOpenAIAgent, BaseEvent } from './custom-openai-agent';
import { EventType } from '@ag-ui/client';
import * as dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

console.log('程式啟動');
console.log('環境變數:', { OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '已設定' : '未設定' });

// Create an instance of our custom agent
const openAIAgent = new CustomOpenAIAgent();
console.log('代理程式已創建');

// Example: Set up some initial messages
openAIAgent.messages = [
  {
    id: '1',
    role: 'user',
    content: 'What can you tell me about the Agent User Interaction Protocol? Please response in Traditional Chinese.',
  },
];
console.log('訊息已設定');

// 添加未處理錯誤的捕獲
process.on('uncaughtException', (err) => {
  console.error('未捕獲的錯誤:', err);
});

// Make a request to OpenAI through our custom agent
console.log('準備呼叫 runAgent()');
const run = openAIAgent.runAgent({
  runId: 'run1',
  threadId: 'thread1'
});
console.log('runAgent() 已呼叫');

// Subscribe to the observable to see events
console.log('準備訂閱 observable');

let textMessage = "";

run.subscribe({
  next: (event: BaseEvent) => {
    // console.log('Event:', event);
    // combine the textMessage with the event content
    if (event.type === EventType.TEXT_MESSAGE_CONTENT && 'delta' in event) {
      textMessage += event.delta;
    }
  },
  error: (err: Error) => {
    console.error('Error:', err);
    // clear the textMessage
    textMessage = "";
  },
  complete: () => {
    console.log('Stream complete');

    // print the final message
    console.log('最終訊息:', textMessage);
    // clear the textMessage
    textMessage = "";
  },
});
console.log('已訂閱 observable');
