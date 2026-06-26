import { NotFoundException } from '@self/exceptions';
import { MemoizationMemory } from '@self/memories';
import { UsersRepository } from '@self/repositories';
import { validation } from '@self/validation';
import { z } from 'zod';

const updatableUser = validation().helpers().ensureField(
  validation().tables().users().updatable(),
);

type Params = z.infer<typeof updatableUser> & {
  id: string;
};

export const updateUsersApplication = async (params: Params) => {

  const { id, ...toUpdate } = params;
  const parsed = updatableUser.parse(toUpdate);

  const user = await UsersRepository.update(parsed)
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

  return user;
};
