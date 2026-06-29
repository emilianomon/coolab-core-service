import { serializeError } from 'serialize-error';

class DataUtil {
  public static errorToObject(error: unknown) {
    const parsed = serializeError(error);
    return parsed;
  }

  public static stringifyError(error: unknown) {
    const parsed = JSON.stringify(DataUtil.errorToObject(error));
    return parsed;
  }
}

export { DataUtil };
