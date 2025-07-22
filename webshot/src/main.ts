/* istanbul ignore file */
import { NestFactory } from "@nestjs/core";
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerDocumentOptions,
} from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./global-exception.filter";
import { INestApplication, ValidationPipe } from "@nestjs/common";

// See: file:///./../tsconfig.json -> "resolveJsonModule" property
// import { version, description } from "../package.json";
import helmet from "helmet";
import compression from "compression";
import { Config } from "./utils/config";

const port = Config.getNumber("server.port");

const createOpenApiDocumentation = (app: INestApplication) => {
  if (require.main === module) {
    const config = new DocumentBuilder()
      .setTitle("SKI Webshot API")
      // .setDescription(description)
      // .setVersion(version)
      .addTag("Report")
      .build();
    const options: SwaggerDocumentOptions = {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
    };
    const documentFactory = () =>
      SwaggerModule.createDocument(app, config, options);
    SwaggerModule.setup("docs", app, documentFactory);
  }
};

export const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(compression());

  createOpenApiDocumentation(app);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port);
  return app;
};

if (require.main === module) {
  bootstrap()
    .then(() => {
      console.log(`Webshot API is running on port ${port}`);
    })
    .catch((err) => {
      console.error("Error during bootstrap:", err);
    });
}
