import { NotFoundException } from '@self/exceptions';
import { MemoizationMemory } from '@self/memories';
import { UsersRepository } from '@self/repositories';
import { UsersService } from '@self/services';

type Params = {
  id: string;
  name?: string | null;
  picture?: string | null;
};

export const updateUsersApplication = async (params: Params) => {

  const { id, picture: receivedPicture, ...rest } = params;

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

  let picture = user.picture;

  if(receivedPicture) {
    picture = await UsersService.uploadPictureBase64(receivedPicture);
  }

  if(receivedPicture === null) {
    picture = null;
  }

  const toUpdate = {
    ...rest,
    ...(receivedPicture !== undefined ? { picture } : {}),
  };

  const result = await UsersRepository.update(toUpdate)
    .where('id', '=', id)
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

  if(receivedPicture !== undefined && user.picture) {
    await UsersService.deletePicture(user.picture);
  }

  await MemoizationMemory.purge(`memo:user-in-platform-context:${id}`);

  const mapped = await UsersService.ensurePictureUrl(result);

  return mapped;
};
