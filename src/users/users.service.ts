import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { users } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // findUnique é um método do prisma que retorna um registro único, que contém a constraint unique.
  // findFirst é um método do prisma que retorna o primeiro registro que satisfaz a condição.

  async getUserById(id: string): Promise<users> {
    const user = await this.prisma.users.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async verifyUserExists(email: string): Promise<boolean> {
    const user = await this.prisma.users.findUnique({
      where: {
        email,
      },
    });

    return user ? true : false;
  }

  async crypto(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10); // 12 padrão mais seguro para produção- porém não recomendado.
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  async createUser(data): Promise<users> {
    const { name, email, password } = data;

    const checkUser = await this.verifyUserExists(email);

    if (!checkUser) {
      const user = await this.prisma.users.create({
        data: {
          name,
          email,
          password: await this.crypto(password),
        },
      });

      if (
        await this.emailService.sendEmail(
          email,
          'Bem vindo ao sistema',
          'Seja muito bem vindo',
          {},
        )
      ) {
        console.log('Email enviado com sucesso');
      }

      if (!user) {
        throw new Error('Erro ao criar usuário.');
      }
      return user;
    } else {
      throw new HttpException('Usuário já existe.', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll() {
    return await this.prisma.users.findMany();
  }

  async findOne(id: string) {
    return await this.prisma.users.findUnique({
      where: {
        id: Number(id),
      },
    });
  }

  async update(id: string, req) {
    //carregue os dados do usuário cujo id foi informado.
    const user = await this.getUserById(id);
    //extraindo as novas informações para alterar o usuário.

    const { name, email, password } = req;

    //verificando se o e-mail está disponível
    if (!name) {
      const checkEmail = await this.prisma.users.findMany({
        where: {
          AND: [{ email: email }, { id: { not: Number(id) } }],
        },
      });

      if (checkEmail.length > 0) {
        throw new HttpException(
          'E-mail já está em uso.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const updatedUser = await this.prisma.users.update({
      where: {
        id: Number(id),
      },
      data: {
        name: name ? name : user.name,
        email: email ? email : user.email,
        password: password ? password : user.password,
      },
    });

    if (!updatedUser) {
      throw new HttpException(
        'Erro ao atualizar usuário',
        HttpStatus.BAD_REQUEST,
      );
    }

    return { msg: `Usuário ${updatedUser.name} atualizado com sucesso!` };
  }

  async remove(id: string) {
    const user = await this.getUserById(id);

    const deletedUser = await this.prisma.users.delete({
      where: {
        id: Number(id),
      },
    });

    if (!deletedUser) {
      throw new HttpException(
        'Erro ao deletar usuário',
        HttpStatus.BAD_REQUEST,
      );
    }

    return { msg: `Usuário ${user.name} Excluído com sucesso!` };
  }
}
