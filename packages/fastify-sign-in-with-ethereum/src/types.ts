import type { SiweApi } from './SiweApi'
import type {SiweMessage} from 'siwe'
export interface StoredSession {
  nonce: string
  message?: SiweMessage
}

export interface SessionStore {
  get(nonce: string): Promise<StoredSession | undefined>,

  save(session: StoredSession): Promise<void>,

  remove(nonce: string): Promise<void>
}

declare module 'fastify' {
  interface FastifyRequest {
    siwe: SiweApi
  }
}
