export function checkPublishByRole(role: string): boolean {
  const roleUpper = role.toUpperCase();
  switch (roleUpper) {
    case "STUDENT":
    case "TEACHER":
      // case "OPERATOR_MANAGEMENT":
      // case "OPERATOR":
      return true;

    default:
      return false;
  }
}
