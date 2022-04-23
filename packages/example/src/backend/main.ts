// Require the framework and instantiate it
import createFastify from 'fastify'
import {signInWithEthereum, SessionAccess, SiweSession} from 'fastify-sign-in-with-ethereum'
const fastify = createFastify({ logger: true })

class Store implements SessionAccess {
  public sessions: Record<string, SiweSession>

  constructor() {
    this.sessions = {}
  }

  public async store(session: SiweSession){
    this.sessions[session.nonce] = session
  }

  async delete(session: SiweSession): Promise<void> {
    throw 'dupa'
  }

  async get(nonce: string): Promise<SiweSession | undefined> {
    return this.sessions[nonce]
  }

}

fastify.register(require('fastify-cors'))

const store = new Store()

fastify.register(signInWithEthereum(store))
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
