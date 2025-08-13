import { Module } from "@nestjs/common";
import { WidgetsController } from "./widgets.controller";
import { WidgetsService } from "./widgets.service";

@Module({
  controllers: [WidgetsController],
  providers: [WidgetsService],
})
export class WidgetsModule {}
