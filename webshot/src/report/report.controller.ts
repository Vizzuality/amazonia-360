import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { Response } from "express";
import { GeoJSON } from "geojson";
import { ReportService } from "./report.service";
import { IsObject, IsOptional, IsString } from "class-validator";

export class PdfReportWebshotConfig {
  @ApiProperty()
  @IsString()
  pagePath!: string;
  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  geometry?: GeoJSON;
  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  generatedTextContent?: Record<string, unknown>;
}

@ApiTags("Report")
@Controller("webshot/api/v1/report")
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post("pdf")
  @ApiOperation({
    summary: "Generate a PDF report for a given data view",
    description:
      "Takes a path to an app page, and an optional GeoJSON object for custom areas, and produces a PDF file with screenshots of the relevant page",
  })
  @ApiBody({
    description: "PDF generation request",
    type: PdfReportWebshotConfig,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "PDF file generated successfully",
    content: {
      "application/pdf": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid request parameters",
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Internal server error during PDF generation",
  })
  async generatePdf(
    @Body(new ValidationPipe()) webshotConfig: PdfReportWebshotConfig,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const pdfBuffer =
        await this.reportService.generatePdfFromUrls(webshotConfig);

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="report.pdf"',
        "Content-Length": pdfBuffer.length.toString(),
      });

      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Failed to generate PDF report",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
