export const extractDate = (data: string) => {
  const dateRegex = /^(\d{4}-\d{2}-\d{2})T/;
  const match = data.match(dateRegex);

  const datePart = match![1];
  return datePart;
};
