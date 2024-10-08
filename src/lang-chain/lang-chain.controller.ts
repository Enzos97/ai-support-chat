import { Controller, Post, Body, BadRequestException, Delete } from '@nestjs/common';
import { LangChainService } from './lang-chain.service';

@Controller('lang-chain')
export class LangChainController {
  constructor(private readonly langChainService: LangChainService) {}

  @Post('text')
  async handleQuery(@Body('text') text: string) {
    const answer = await this.langChainService.generateAnswer(text);
    return { answer };
  }

  @Delete('clear-chat-history')
  clearChatHistory() {
    this.langChainService.clearChatHistory();
    return { message: 'Historial de chat borrado exitosamente.' };
  }
}
