import { Module } from '@nestjs/common';
import { LangChainService } from './lang-chain.service';
import { LangChainController } from './lang-chain.controller';
import { TestWorkflowModule } from 'src/test-workflow/test-workflow.module';

@Module({
  imports: [TestWorkflowModule],
  controllers: [LangChainController],
  providers: [LangChainService],
  exports: [LangChainService]
})
export class LangChainModule {}
