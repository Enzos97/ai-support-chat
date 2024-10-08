import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { LangChainService } from 'src/lang-chain/lang-chain.service';

@Controller('gemini')
export class GeminiController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly langChainService: LangChainService
  ) {}
  @Post('test')
  async testEndpoint(@Body('text') text:string){
    return await this.geminiService.sendMessage(text)
  }

  @Post('send-message')
  async sendMessage(@Body('text') text: string) {
    if (!text) {
      throw new BadRequestException('El texto no fue proporcionado.');
    }

    const response = await this.geminiService.sendMessage(text);
    return { message: response };
  }
  
  @Post('send-message-stream')
  async sendMessageStream(@Body('text') text: string) {
    if (!text) {
      throw new BadRequestException('El texto no fue proporcionado.');
    }

    const response = await this.geminiService.sendMessageStream(text);
    return { message: response };
  }

}
