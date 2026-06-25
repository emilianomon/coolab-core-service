import { PlatformContext } from '@self/contexts';

export const retrieveCurrentUsersApplication = async () => {
  return PlatformContext.getUser();
};
