import type {FastifyInstance, FastifyRequest} from 'fastify'
import fp from 'fastify-plugin'
import {generateNonce, SiweMessage} from 'siwe'

export interface StoredSession {
  nonce: string
  message?: SiweMessage
}

export interface SessionAccess {
  store(session: StoredSession): Promise<void>,

  delete(session: StoredSession): Promise<void>,

  get(nonce: string): Promise<StoredSession | undefined>,
}

class SiweApi {
  constructor(
    private readonly _store: SessionAccess,
  ) {}

  public session?: SiweMessage

  async generateNonce(): Promise<string> {
    const nonce = generateNonce()
    await this._store.store({
      nonce,
    })
    return nonce
  }

  async destroySession(): Promise<void> {
    this.session = undefined
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    siwe: SiweApi
  }
}


export const signInWithEthereum = (store: SessionAccess) => fp(async (fastify: FastifyInstance) => {

  fastify.addHook('preHandler', async (request, reply) => {
    request.siwe = new SiweApi(store)

    const authHeader = request.headers.authorization
    console.log({authHeader})
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return
    }

    try {
      const token = authHeader.slice(authHeader.indexOf(' ') + 1)

      console.log({token})

      const {message, signature} = JSON.parse(token)

      const siweMessage = new SiweMessage(message)

      await siweMessage.validate(signature)
      const currentSession = await store.get(siweMessage.nonce)
      console.log({currentSession, siweMessage})
      if (!currentSession || siweMessage.nonce !== currentSession.nonce) {
        reply.status(403).send('invalid nonce')
        return
      }

      currentSession.message = siweMessage
      await store.store(currentSession)

      request.siwe.session = siweMessage
    } catch (err) {
      console.log('ERR', err)
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
      reply.send({
        nonce: await req.siwe.generateNonce(),
      })
    },
  )


}, {name: 'SIWE'})
