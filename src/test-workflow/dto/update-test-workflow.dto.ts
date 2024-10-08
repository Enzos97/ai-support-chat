import { PartialType } from '@nestjs/mapped-types';
import { CreateTestWorkflowDto } from './create-test-workflow.dto';

export class UpdateTestWorkflowDto extends PartialType(CreateTestWorkflowDto) {}
