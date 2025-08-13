import { Module } from "@nestjs/common";
import { ReportModule } from "./report/report.module";
import { WidgetsModule } from "./widgets/widgets.module";

@Module({
  imports: [ReportModule, WidgetsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
