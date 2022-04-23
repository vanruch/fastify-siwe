// Require the framework and instantiate it
import createFastify, {FastifyInstance, FastifyRequest} from 'fastify'
import {signInWithEthereum, SessionAccess, StoredSession} from 'fastify-sign-in-with-ethereum'
const fastify = createFastify({ logger: true })

class Store implements SessionAccess {
  public sessions: Record<string, StoredSession>

  constructor() {
    this.sessions = {}
  }

  public async store(session: StoredSession){
    this.sessions[session.nonce] = session
  }

  async delete(session: StoredSession): Promise<void> {
    throw 'dupa'
  }

  async get(nonce: string): Promise<StoredSession | undefined> {
    return this.sessions[nonce]
  }

}

fastify.register(require('fastify-cors'))

const store = new Store()

fastify.register(signInWithEthereum(store))

fastify.get(
  '/siwe/me',
  {},
  async function handler(
    this: FastifyInstance,
    req: FastifyRequest,
    reply,
  ) {
    if (!req.siwe.session) {
      reply.status(401).send()
      return
    }

    reply.code(200).send({
      loggedIn: true,
      message: req.siwe.session,
    })
  },
)

// Run the server!
const start = async () => {
  try {
    await fastify.listen(3001)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
