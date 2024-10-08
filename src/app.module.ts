import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GeminiModule } from './gemini/gemini.module';
import { LangChainModule } from './lang-chain/lang-chain.module';
import { ConfigModule } from '@nestjs/config';
import { TestWorkflowModule } from './test-workflow/test-workflow.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    GeminiModule, 
    LangChainModule, TestWorkflowModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
