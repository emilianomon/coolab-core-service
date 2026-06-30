import { NotFoundException } from '@self/exceptions';
import { MemoizationMemory } from '@self/memories';
import { WorkspacesRepository } from '@self/repositories';
import { WorkspacesService } from '@self/services';

type Params = {
  id: string;
  name?: string;
  picture?: string | null;
  userId: string;
};

export const updateWorkspacesApplication = async (params: Params) => {
  const { id, picture: receivedPicture, userId, ...rest } = params;

  const workspace = await WorkspacesRepository.selectById(id)
    .selectAll()
    .executeTakeFirst();

  if(!workspace) {
    throw new NotFoundException({
      feedback: {
        enUs: 'The workspace was not found.',
        esEs: 'El workspace no fue encontrado.',
        ptBr: 'O workspace não foi encontrado.',
      },
      message: 'The workspace was not found.',
    });
  }

  let picture = workspace.picture;

  if(receivedPicture) {
    picture = await WorkspacesService.uploadPictureBase64(receivedPicture);
  }

  if(receivedPicture === null) {
    picture = null;
  }

  const toUpdate = {
    ...rest,
    ...(receivedPicture !== undefined ? { picture } : {}),
  };

  const result = await WorkspacesRepository.update(toUpdate)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();

  if(!result) {
    throw new NotFoundException({
      feedback: {
        enUs: 'The workspace was not found.',
        esEs: 'El workspace no fue encontrado.',
        ptBr: 'O workspace não foi encontrado.',
      },
      message: 'The workspace was not found.',
    });
  }

  if(receivedPicture !== undefined && workspace.picture) {
    await WorkspacesService.deletePicture(workspace.picture);
  }

  await MemoizationMemory.purge(`memo:user-workspace-in-platform-context:${userId}:${id}`);

  const mapped = await WorkspacesService.ensurePictureUrl(result);

  return mapped;
};
