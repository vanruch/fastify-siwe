import type { SiweApi } from './SiweApi'
import type {SiweMessage} from 'siwe'
export interface StoredSession {
  nonce: string
  message?: SiweMessage
}

export interface SessionStore {
  save(session: StoredSession): Promise<void>,

  get(nonce: string): Promise<StoredSession | undefined>,
}

declare module 'fastify' {
  interface FastifyRequest {
    siwe: SiweApi
  }
}
