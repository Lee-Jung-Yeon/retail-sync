import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors({ origin: '*' });
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`🛍️ Retail Sync API running on port ${port}/api`);
}
bootstrap();
