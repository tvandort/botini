export function capitalize(stringToCapitalize: string) {
  if (!stringToCapitalize?.length) {
    return;
  }

  return stringToCapitalize[0].toUpperCase() + stringToCapitalize.slice(1);
}
