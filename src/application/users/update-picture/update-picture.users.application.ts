import { NotFoundException } from '@self/exceptions';
import { UsersRepository } from '@self/repositories';
import { UsersService } from '@self/services';

type Params = {
  id: string;
  picture: Buffer;
};

export const updatePictureUsersApplication = async (params: Params) => {
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

  if(user.picture) {
    await UsersService.deletePicture(user.picture);
  }

  const picture = await UsersService.uploadPicture(params.picture);

  const result = await UsersRepository.update({ picture })
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

  await UsersService.purgeUserMemo(params.id);

  const mapped = await UsersService.ensurePictureUrl(result);

  return mapped;
};
