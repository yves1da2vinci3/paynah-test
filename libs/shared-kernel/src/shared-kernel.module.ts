import { Module } from '@nestjs/common';
import { SharedKernelService } from './shared-kernel.service.js';

@Module({
  providers: [SharedKernelService],
  exports: [SharedKernelService],
})
export class SharedKernelModule {}
