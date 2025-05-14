// src/custom-openai-agent.ts
import { EventType, Message } from '@ag-ui/client';
import { Observable } from 'rxjs';
import { OpenAI } from 'openai';

// 自定義事件接口
export interface BaseEvent {
  type: EventType;
  timestamp?: number;
  rawEvent?: any;
}

export interface RunStartedEvent extends BaseEvent {
  type: EventType.RUN_STARTED;
  threadId: string;
  runId: string;
}

export interface TextMessageStartEvent extends BaseEvent {
  type: EventType.TEXT_MESSAGE_START;
  messageId: string;
  role: string;
}

export interface TextMessageContentEvent extends BaseEvent {
  type: EventType.TEXT_MESSAGE_CONTENT;
  messageId: string;
  delta: string;
}

export interface TextMessageEndEvent extends BaseEvent {
  type: EventType.TEXT_MESSAGE_END;
  messageId: string;
}

export interface RunFinishedEvent extends BaseEvent {
  type: EventType.RUN_FINISHED;
  threadId: string;
  runId: string;
}

export class CustomOpenAIAgent {
  private client: OpenAI;
  public messages: Array<Message | { id: string; role: string; content: string }> = [];

  constructor(apiKey?: string) {
    // 如果 apiKey 是 "ollama"，則使用自定義的 baseURL
    const options: any = {};
    if (apiKey === 'ollama' || process.env.OPENAI_API_KEY === 'ollama') {
      console.log('使用 Ollama API');
      options.baseURL = 'http://localhost:11434/v1';  // ollama 本地服務
      options.apiKey = 'ollama';  // 任意值，因為 ollama 不需要 API key
    } else {
      console.log('使用 OpenAI API');
      options.apiKey = apiKey || process.env.OPENAI_API_KEY;
    }
    
    this.client = new OpenAI(options);
  }

  // 公共方法，直接返回 Observable
  public runAgent(params: { runId: string; threadId?: string }): Observable<BaseEvent> {
    const threadId = params.threadId || `thread_${Date.now()}`;
    const runId = params.runId;
    const messages = this.messages;

    return new Observable<BaseEvent>((observer) => {
      // 1) Emit RUN_STARTED
      observer.next({
        type: EventType.RUN_STARTED,
        threadId,
        runId,
      } as RunStartedEvent);

      // Convert AG-UI messages to OpenAI format
      const openaiMessages = messages
        .filter((msg: any) => ['user', 'system', 'assistant'].includes(msg.role))
        .map((msg: any) => ({
          role: msg.role as 'user' | 'system' | 'assistant',
          content: msg.content || '',
        }));

      // Generate a message ID for the assistant's response
      const messageId = Date.now().toString();

      // Emit message start event
      observer.next({
        type: EventType.TEXT_MESSAGE_START,
        messageId,
        role: 'assistant',
      } as TextMessageStartEvent);

      console.log('發送請求到 OpenAI 或 Ollama...');
      // console.log('使用模型:', process.env.OPENAI_API_KEY === 'ollama' ? 'llama3:8b' : 'gpt-3.5-turbo');
      console.log('使用模型:', process.env.OPENAI_MODEL);
      console.log('訊息:', JSON.stringify(openaiMessages, null, 2));

      // Create a streaming completion request
      this.client.chat.completions
        .create({
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          messages: openaiMessages,
          stream: true,
        })
        .then(async (stream) => {
          try {
            // Process the streaming response
            for await (const chunk of stream) {
              if (chunk.choices[0]?.delta?.content) {
                const content = chunk.choices[0].delta.content;
                observer.next({
                  type: EventType.TEXT_MESSAGE_CONTENT,
                  messageId,
                  delta: content,
                } as TextMessageContentEvent);
              }
            }

            // Emit message end event
            observer.next({
              type: EventType.TEXT_MESSAGE_END,
              messageId,
            } as TextMessageEndEvent);

            // Emit RUN_FINISHED and complete
            observer.next({
              type: EventType.RUN_FINISHED,
              threadId,
              runId,
            } as RunFinishedEvent);

            observer.complete();
          } catch (error) {
            observer.error(error);
          }
        })
        .catch((error) => {
          console.error('OpenAI API 錯誤:', error);
          observer.error(error);
        });

      // Return a cleanup function
      return () => {
        // Nothing to clean up for OpenAI
      };
    });
  }
}
