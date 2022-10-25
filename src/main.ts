import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();


// uma aplicação eu crio uma unica vez
//toda aplicação tem acesso. por exemplo: comunicação com o banco de dados