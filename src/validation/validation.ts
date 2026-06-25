import { z } from 'zod';

import { datetime } from './datetime';
import { email } from './email';
import { empty } from './empty';
import { exception } from './exception';
import { helpers } from './helpers';
import { id } from './id';
import { language } from './language';
import { tables } from './tables';

export const validation = () => ({
  ...z,
  datetime,
  email,
  empty,
  exception,
  helpers,
  id,
  language,
  tables,
});
