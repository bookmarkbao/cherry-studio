import { WithButton } from './button'
import { Input as InternalInput } from './input'
import { Password } from './password'

type CompoundedComponent = typeof InternalInput & {
  Password: typeof Password
  Button: typeof WithButton
}

const Input: CompoundedComponent = InternalInput as CompoundedComponent
Input.Password = Password
Input.Button = WithButton

export { Input }
