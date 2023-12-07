import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //FOR BETTER ERROR MESSAGES
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors) => {
        function getConstraints(error) {
          if (error.children && error.children.length > 0) {
            return error.children.flatMap((childError) =>
              getConstraints(childError),
            );
          }
          return Object.values(error.constraints);
        }

        const errorMessages = validationErrors
          .flatMap((error) => getConstraints(error))
          .flat();

        return new BadRequestException({
          message:
            errorMessages.length > 0 ? errorMessages : ['Validation failed'],
        });
      },
    }),
  );

  await app.listen(3000);
}
bootstrap();
