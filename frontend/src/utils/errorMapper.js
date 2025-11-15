export default function mapServerError(err) {
  const apiMessage = err?.response?.data?.message || err?.response?.data?.error || err?.message || ''
  const msg = String(apiMessage || '').toLowerCase()

  if (!apiMessage) return 'An unexpected error occurred.'

  if (/login already in use|login already exists/i.test(msg)) return 'Login already in use.'
  if (/email already in use|email already exists/i.test(msg)) return 'Email already in use.'
  if (/confirm password does not match|passwords do not match/i.test(msg)) return 'Confirm password does not match password.'
  if (/all fields are required/i.test(msg)) return 'All fields are required.'
  if (/not authenticated/i.test(msg)) return 'Not authenticated. Please log in.'
  if (/invalid token|already confirmed|already verified/i.test(msg)) return 'This email is already verified.'
  if (/invalid email/i.test(msg)) return 'Invalid email address.'
  if (/invalid email, login or password|invalid email or password|invalid email or login/i.test(msg)) return 'Invalid credentials.'

  return typeof apiMessage === 'string' ? apiMessage : 'An unexpected error occurred.'
}
