import createFastify, {FastifyInstance, FastifyRequest} from 'fastify'
import {signInWithEthereum,} from 'fastify-sign-in-with-ethereum'
import cors from 'fastify-cors'

const fastify = createFastify({ logger: true })

fastify.register(cors)
fastify.register(signInWithEthereum())

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

const start = async () => {
  try {
    await fastify.listen(3001)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
