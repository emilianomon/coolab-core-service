import { NotFoundException, PreconditionFailedException } from '@self/exceptions';
import { MemoizationMemory } from '@self/memories';
import { UsersRepository } from '@self/repositories';
import { UsersService } from '@self/services';

type Params = {
  id: string;
};

export const removePictureUsersApplication = async (params: Params) => {
  const user = await UsersRepository.selectById(params.id)
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

  if(!user.picture) {
    throw new PreconditionFailedException({
      feedback: {
        enUs: 'The user does not have a picture.',
        esEs: 'El usuario no tiene una imagen.',
        ptBr: 'O usuário não tem uma imagem.',
      },
      message: 'The user does not have a picture.',
    });
  }

  await UsersService.deletePicture(user.picture);

  const result = await UsersRepository.update({
    picture: null,
  })
    .where('id', '=', params.id)
    .returningAll()
    .executeTakeFirst();

  if(!result) {
    throw new NotFoundException({
      feedback: {
        enUs: 'The user was not found.',
        esEs: 'El usuario no fue encontrado.',
        ptBr: 'O usuário não foi encontrado.',
      },
      message: 'The user was not found.',
    });
  }

  await MemoizationMemory.purge(`memo:user-in-platform-context:${params.id}`);

  const mapped = await UsersService.ensurePictureUrl(result);

  return mapped;
};
