const dates = <T>(obj: T) => {
  if(typeof obj !== 'object' || obj === null) return obj;

  const serialized = JSON.stringify(obj);
  const parsed = JSON.parse(serialized, (_key, value) => {
    if(typeof value !== 'string') return value;
    if(value.split(':').length !== 3) return value;
    if(value.split('-').length !== 3) return value;

    const date = new Date(value);
    const timestamp = date.getTime();
    if(Number.isNaN(timestamp)) return value;

    return date;
  });

  return parsed as T;
};

export const autoparser = () => ({
  dates,
});
