import { WorkspaceUsersRepository } from '@self/repositories';
import { UsersService } from '@self/services';
import { Pagination } from '@self/types';
import { SelectableUser } from '@self/validation/tables/users';
import { SelectableWorkspaceUser } from '@self/validation/tables/workspace-users';

type Params = {
  pagination: Pagination;
  workspaceId: string;
};

type PublicUser = Pick<SelectableUser,
  'createdAt'
  | 'email'
  | 'id'
  | 'name'
  | 'picture'
  | 'updatedAt'
>;

type WorkspaceUser = SelectableWorkspaceUser & {
  user: PublicUser;
};

type Result = Array<WorkspaceUser>;

export const retrieveUsersWorkspacesApplication = async (params: Params): Promise<Result> => {
  const { limit, page } = params.pagination;

  const workspaceUsers = await WorkspaceUsersRepository.select()
    .innerJoin('users', 'workspaceUsers.userId', 'users.id')
    .where('workspaceUsers.workspaceId', '=', params.workspaceId)
    .selectAll('workspaceUsers')
    .select([
      'users.createdAt as userCreatedAt',
      'users.email as userEmail',
      'users.id as nestedUserId',
      'users.name as userName',
      'users.picture as userPicture',
      'users.updatedAt as userUpdatedAt',
    ])
    .orderBy('workspaceUsers.createdAt', 'asc')
    .limit(limit)
    .offset((page - 1) * limit)
    .execute();

  const mapped = await Promise.all(workspaceUsers.map(async workspaceUser => {
    const user = await UsersService.ensurePictureUrl({
      createdAt: workspaceUser.userCreatedAt,
      email: workspaceUser.userEmail,
      id: workspaceUser.nestedUserId,
      name: workspaceUser.userName,
      picture: workspaceUser.userPicture,
      updatedAt: workspaceUser.userUpdatedAt,
    });

    const result = {
      createdAt: workspaceUser.createdAt,
      role: workspaceUser.role,
      updatedAt: workspaceUser.updatedAt,
      user,
      userId: workspaceUser.userId,
      workspaceId: workspaceUser.workspaceId,
    };

    return result;
  }));

  return mapped;
};
