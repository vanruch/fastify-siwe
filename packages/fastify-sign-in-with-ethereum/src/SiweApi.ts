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
    this.session = undefined;
  }
}
