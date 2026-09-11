/** Ported from api_emr_node's src/utils/age.util.ts to keep age math identical. */
export function calculateAge(birthday: string | Date | undefined | null): number | null {
  if (!birthday) return null;
  const ageDifMs = Date.now() - new Date(birthday).getTime();
  if (ageDifMs < 0) return null;
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
