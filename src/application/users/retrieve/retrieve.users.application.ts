import { NotFoundException } from '@self/exceptions';
import { UsersRepository } from '@self/repositories';
import { UsersService } from '@self/services';

export const retrieveUsersApplication = async ({ id }: { id: string }) => {

  const user = await UsersRepository.selectById(id)
    .selectAll()
    .executeTakeFirst();

  if(!user) {
    throw new NotFoundException({
      feedback: {
        enUs: 'The user was not found.',
        esEs: 'El usuario no fue encontrado.',
        ptBr: 'O usuário não foi encontrado.',
      },
      message: 'The user was not found.',
    });
  }

  const mapped = await UsersService.ensurePictureUrl(user);

  return mapped;
};
