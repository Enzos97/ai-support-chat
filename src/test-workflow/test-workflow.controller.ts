import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TestWorkflowService } from './test-workflow.service';
import { CreateTestWorkflowDto } from './dto/create-test-workflow.dto';
import { UpdateTestWorkflowDto } from './dto/update-test-workflow.dto';
import { ContentDto } from './dto/content.dto';

@Controller('test-workflow')
export class TestWorkflowController {
  constructor(private readonly testWorkflowService: TestWorkflowService) {}

  @Post()
  create(@Body() content: ContentDto) {
    return this.testWorkflowService.processMessage(content);
  }

}
