import { User } from '@cherrystudio/api-sdk'

export function isAdmin(user: User) {
  return user.roles.some((role) => role.name === 'admin')
}
