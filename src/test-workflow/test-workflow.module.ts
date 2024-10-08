import { Module } from '@nestjs/common';
import { TestWorkflowService } from './test-workflow.service';
import { TestWorkflowController } from './test-workflow.controller';

@Module({
  controllers: [TestWorkflowController],
  providers: [TestWorkflowService],
  exports:[TestWorkflowService]
})
export class TestWorkflowModule {}
