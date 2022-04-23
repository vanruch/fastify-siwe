import type {FastifyInstance, FastifyRequest} from 'fastify'
import fp from 'fastify-plugin'
import {generateNonce, SiweMessage} from 'siwe'

export interface SiweSession {
  nonce: string
  message?: SiweMessage
}

export interface SessionAccess {
  store(session: SiweSession): Promise<void>,

  delete(session: SiweSession): Promise<void>,

  get(nonce: string): Promise<SiweSession | undefined>,
}

declare module 'fastify' {
  interface FastifyRequest {
    siweSession: SiweSession | null
  }
}


export const signInWithEthereum = (session: SessionAccess) => fp(async (fastify: FastifyInstance) => {

  fastify.decorate('siweSession', null)

  fastify.addHook('preHandler', async (request, reply) => {
    const authHeader = request.headers.authorization
    console.log({authHeader})
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return
    }

    try {
      const token = authHeader.slice(authHeader.indexOf(' ') + 1)

      const {message, signature} = JSON.parse(token)

      const siweMessage = new SiweMessage(message)

      await siweMessage.validate(signature)
      const currentSession = await session.get(siweMessage.nonce)

      if (!currentSession || siweMessage.nonce !== currentSession.nonce) {
        reply.status(403).send('invalid nonce')
        return
      }

      currentSession.message = siweMessage
      await session.store(currentSession)
      request.siweSession = currentSession
    } catch (err) {
      console.log(err)
      reply.status(401).send()
    }
  })

  fastify.post(
    '/siwe/init',
    {},
    async function handler(
      this: FastifyInstance,
      req: FastifyRequest,
      reply,
    ) {
      const nonce = generateNonce()
      await session.store({
        nonce,
      })
      reply.send({nonce})
    },
  )

  fastify.get(
    '/siwe/me',
    {},
    async function handler(
      this: FastifyInstance,
      req: FastifyRequest,
      reply,
    ) {
      if (!req.siweSession) {
        reply.status(401).send()
        return
      }

      reply.code(200).send({
        loggedIn: true,
        message: req.siweSession.message,
      })
    },
  )
}, {name: 'SIWE'})
