import { connection } from '@self/database';
import { WorkspacesRepository, WorkspaceUsersRepository } from '@self/repositories';
import { WorkspacesService } from '@self/services';

type Params = {
  name: string;
  picture?: string | null;
  userId: string;
};

export const createWorkspacesApplication = async (params: Params) => {
  const workspace = await connection.transaction().execute(async transaction => {
    let picture: string | null = null;

    if(params.picture) {
      picture = await WorkspacesService.uploadPictureBase64(params.picture);
    }

    const created = await WorkspacesRepository.insert({
      name: params.name,
      picture,
    }, {
      transaction,
    })
      .returningAll()
      .executeTakeFirstOrThrow();

    await WorkspaceUsersRepository.insert({
      role: 'owner',
      userId: params.userId,
      workspaceId: created.id,
    }, {
      transaction,
    })
      .executeTakeFirstOrThrow();

    return created;
  });

  const mapped = await WorkspacesService.ensurePictureUrl(workspace);

  return mapped;
};
