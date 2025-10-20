import { beforeAll, afterEach } from 'vitest'
import { config } from '@vue/test-utils'

// Silence console noise optionally or customize
const originalError = console.error
console.error = (...args) => {
  if (/not wrapped in act|Vue received a Component which was not/.test(args[0])) return
  originalError(...args)
}

// Example: global directive or component mocks can go here
config.global.mocks = {
  t: (k: string) => k
}

beforeAll(() => {
  // Setup global things if necessary
})

afterEach(() => {
  // Cleanup if needed between tests
})
