// src/openai-agent.ts
import {
  AbstractAgent,
  RunAgent,
  RunAgentInput,
  EventType,
  BaseEvent,
  RunStartedEventSchema,
  TextMessageStartEventSchema,
  TextMessageContentEventSchema,
  TextMessageEndEventSchema,
  RunFinishedEventSchema,
  Message,
} from '@ag-ui/client';
import { Observable } from 'rxjs';
import { OpenAI } from 'openai';

export class OpenAIAgent extends AbstractAgent {
  private client: OpenAI;

  constructor(apiKey?: string) {
    super();
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  }

  protected run(input: RunAgentInput): RunAgent {
    return () => {
      return new Observable<BaseEvent>((observer) => {
        // 1) Emit RUN_STARTED
        observer.next(
          RunStartedEventSchema.parse({
            type: EventType.RUN_STARTED,
            threadId: input.threadId,
            runId: input.runId,
          })
        );

        // Convert AG-UI messages to OpenAI format
        const openaiMessages = input.messages
          .filter((msg: Message) =>
            ['user', 'system', 'assistant'].includes(msg.role)
          )
          .map((msg: Message) => ({
            role: msg.role as 'user' | 'system' | 'assistant',
            content: msg.content || '',
          }));

        // Generate a message ID for the assistant's response
        const messageId = Date.now().toString();

        // Emit message start event
        observer.next(
          TextMessageStartEventSchema.parse({
            type: EventType.TEXT_MESSAGE_START,
            messageId,
            role: 'assistant',
          })
        );

        // Create a streaming completion request
        this.client.chat.completions
          .create({
            model: 'gpt-3.5-turbo',
            messages: openaiMessages,
            stream: true,
          })
          .then(async (stream) => {
            try {
              // Process the streaming response
              for await (const chunk of stream) {
                if (chunk.choices[0]?.delta?.content) {
                  const content = chunk.choices[0].delta.content;
                  observer.next(
                    TextMessageContentEventSchema.parse({
                      type: EventType.TEXT_MESSAGE_CONTENT,
                      messageId,
                      delta: content,
                    })
                  );
                }
              }

              // Emit message end event
              observer.next(
                TextMessageEndEventSchema.parse({
                  type: EventType.TEXT_MESSAGE_END,
                  messageId,
                })
              );

              // Emit RUN_FINISHED and complete
              observer.next(
                RunFinishedEventSchema.parse({
                  type: EventType.RUN_FINISHED,
                  threadId: input.threadId,
                  runId: input.runId,
                })
              );

              observer.complete();
            } catch (error) {
              observer.error(error);
            }
          })
          .catch((error) => {
            observer.error(error);
          });

        // Return a cleanup function
        return () => {
          // Nothing to clean up for OpenAI
        };
      });
    };
  }
}
