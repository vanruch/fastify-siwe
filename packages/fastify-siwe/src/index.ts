import type { FastifyInstance, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { SiweMessage } from 'siwe'
import { InMemoryStore } from './InMemoryStore'
import { SiweApi } from './SiweApi'
import { SessionStore } from './types'

export interface FastifySiweOptions {
  store?: SessionStore
}

export const signInWithEthereum = ({ store = new InMemoryStore() }: FastifySiweOptions = {}) =>
  fp(async (fastify: FastifyInstance) => {
    fastify.addHook('preHandler', async (request, reply) => {
      request.siwe = new SiweApi(store)

      const token = extractAuthToken(request)
      if (!token) {
        return
      }

      try {
        const siweMessage = await parseAndValidateToken(token)

        const currentSession = await store.get(siweMessage.nonce)
        if (!currentSession || siweMessage.nonce !== currentSession.nonce) {
          reply.status(403).send('Invalid nonce')
          return
        }

        currentSession.message = siweMessage
        await store.save(currentSession)

        request.siwe.session = siweMessage
      } catch (err) {
        reply.status(401).send()
      }
    })

  }, { name: 'SIWE' })

export { SessionStore, InMemoryStore }

function extractAuthToken(request: FastifyRequest): string | undefined {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return
  }

  return authHeader.slice(authHeader.indexOf(' ') + 1)
}

async function parseAndValidateToken(token: string): Promise<SiweMessage> {
  const { message, signature } = JSON.parse(token)

  const siweMessage = new SiweMessage(message)

  await siweMessage.validate(signature)

  return message
}
