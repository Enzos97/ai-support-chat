import { Injectable } from '@nestjs/common';
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import { ChatOpenAI } from '@langchain/openai';
import { ContentDto } from './dto/content.dto';

@Injectable()
export class TestWorkflowService {

  private llm = new ChatOpenAI({
    model: 'gpt-3.5-turbo',
    temperature: 0
  });
  public getLLM() {
    return this.llm;
  }

  public getWorkflow() {
    return this.app;
  }

  public getMemoryConfig() {
    return this.config;
  }

  private callModel = async (state: typeof MessagesAnnotation.State) => {
    const response = await this.llm.invoke(state.messages);
    return { messages: response };
  };


  private workflow = new StateGraph(MessagesAnnotation)
    .addNode('model', this.callModel)
    .addEdge(START, 'model')
    .addEdge('model', END);

  private memory = new MemorySaver();
  private app = this.workflow.compile({ checkpointer: this.memory });


  private config = { configurable: { thread_id: uuidv4() } };


  async processMessage(contentDto: ContentDto) {
    const input = [
      {
        role: 'user',  
        content: contentDto.content
      }
    ];
    const output = await this.app.invoke({ messages: input }, this.config);
    return output.messages[output.messages.length - 1];
  }
}
