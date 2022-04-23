import { SessionStore, StoredSession } from "./types"

export class InMemoryStore implements SessionStore {
  public sessions: Record<string, StoredSession>

  constructor() {
    this.sessions = {}
  }

  public async save(session: StoredSession){
    this.sessions[session.nonce] = session
  }

  async get(nonce: string): Promise<StoredSession | undefined> {
    return this.sessions[nonce]
  }

  async remove(nonce: string): Promise<void> {
    delete this.sessions[nonce]
  }

}