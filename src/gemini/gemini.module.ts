import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GeminiController } from './gemini.controller';
import { LangChainModule } from 'src/lang-chain/lang-chain.module';

@Module({
  imports:[LangChainModule],
  controllers: [GeminiController],
  providers: [GeminiService],
})
export class GeminiModule {}
