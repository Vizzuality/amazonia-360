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
import { WidgetsService } from "./widgets.service";
import { IsObject, IsOptional, IsString } from "class-validator";
import { sanitizeFilename } from "../utils/sanitize-filenames";

export class WidgetAsImageWebshotConfig {
  @ApiProperty()
  @IsString()
  pagePath!: string;
  @ApiPropertyOptional()
  @IsString()
  outputFileName?: string;
  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  params?: Record<string, unknown>;
}

@ApiTags("Widgets")
@Controller("webshot/api/v1/widgets")
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Post("png")
  @ApiOperation({
    summary: "Generate a PNG image from an application page",
    description:
      "Takes a path to an app page and produces a PNG file with a snapshot of the relevant page. Intended to be used to take snapshots of app widgets.",
  })
  @ApiBody({
    description: "PNG generation request",
    type: WidgetAsImageWebshotConfig,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "PNG file generated successfully",
    content: {
      "application/png": {
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
    description: "Internal server error during PNG generation",
  })
  async generatePdf(
    @Body(new ValidationPipe()) webshotConfig: WidgetAsImageWebshotConfig,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const filename = sanitizeFilename(
        webshotConfig.outputFileName ?? "widget.png",
      );
      const pngBuffer =
        await this.widgetsService.generatePngSnapshot(webshotConfig);

      res.set({
        "Content-Type": "application/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pngBuffer.length.toString(),
      });

      res.status(HttpStatus.OK).send(pngBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Failed to generate PNG snapshot",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
