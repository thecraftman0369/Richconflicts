/** ke***@gmail.com — masks local part, preserves domain */
export function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at < 0) return email
  const local  = email.slice(0, at)
  const domain = email.slice(at)
  const visible = Math.min(2, local.length)
  return local.slice(0, visible) + '***' + domain
}
