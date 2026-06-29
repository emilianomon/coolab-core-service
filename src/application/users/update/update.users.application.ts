import { NotFoundException } from '@self/exceptions';
import { MemoizationMemory } from '@self/memories';
import { UsersRepository } from '@self/repositories';
import { UsersService } from '@self/services';

type Params = {
  id: string;
  name?: string | null;
};

export const updateUsersApplication = async (params: Params) => {

  const { id, ...toUpdate } = params;

  const user = await UsersRepository.update(toUpdate)
    .where('id', '=', id)
    .returningAll()
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

  await MemoizationMemory.purge(`memo:user-in-platform-context:${id}`);

  const mapped = await UsersService.ensurePictureUrl(user);

  return mapped;
};
