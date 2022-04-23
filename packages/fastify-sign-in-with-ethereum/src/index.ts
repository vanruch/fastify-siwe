import type {FastifyInstance, FastifyRequest} from 'fastify'

import {generateNonce, SiweMessage} from 'siwe'

export interface SiweSession {
  nonce: string
  timestamp?: Date
  address?: string
}

export interface SessionAccess {
  store(session: SiweSession): Promise<void>,
  delete(session: SiweSession): Promise<void>,
  get(nonce: string): Promise<SiweSession | undefined>,
}

export const signInWithEthereum = (session: SessionAccess) => async (fastify: FastifyInstance) => {
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
        timestamp: new Date(),
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
      const authHeader = req.headers.authorization
      console.log({authHeader})
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.status(401).send()
        return
      }

      try {
        const token = authHeader.slice(authHeader.indexOf(' ') + 1)

        const {message, signature} = JSON.parse(token)

        const siweMessage = new SiweMessage(message)

        await siweMessage.validate(signature)
        const currentSession = await session.get(siweMessage.nonce)

        console.log({currentSession})

        if (!currentSession || siweMessage.nonce !== currentSession.nonce) {
          reply.status(403).send('invalid nonce')
          return
        }

        reply.code(200).send({
          loggedIn: true,
          message: siweMessage,
        })
      } catch (err) {
        console.log(err)
        reply.status(401).send()
      }
    },
  )
}
