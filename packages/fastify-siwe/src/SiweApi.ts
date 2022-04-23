import { generateNonce, SiweMessage } from 'siwe';
import { SessionStore } from './index';

export class SiweApi {
  constructor(
    private readonly _store: SessionStore
  ) { }

  public session?: SiweMessage;

  async generateNonce(): Promise<string> {
    const nonce = generateNonce();
    await this._store.save({
      nonce,
    });
    return nonce;
  }

  async destroySession(): Promise<void> {
    if(!this.session?.nonce) {
      throw new Error('No session to destroy');
    }
    
    await this._store.remove(this.session.nonce);
    this.session = undefined;
  }
}
