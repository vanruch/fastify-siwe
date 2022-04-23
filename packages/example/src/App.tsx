import { useState } from 'react'
import logo from './logo.svg'
import './App.css'
import { providers } from 'ethers'
import { SiweMessage } from 'siwe';

async function getNonce(): Promise<string> {
  return 'test'
}

function App() {
  async function signIn() {
    const provider = new providers.Web3Provider((window as any).ethereum);
    // Prompt user for account connections
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();

    const domain = window.location.host;
    const origin = window.location.origin;
    const statement = 'Sign in with Ethereum to the app.';

    const message = new SiweMessage({
      domain,
      address: await signer.getAddress(),
      statement,
      uri: origin,
      version: '1',
      chainId: 1,
      nonce: await getNonce()
    });

    const signature = await signer.signMessage(message.prepareMessage());

    localStorage.setItem('signature', JSON.stringify({ signature, message }));

    console.log({ message, signature })
  }

  return (
    <div className="App">
      <button onClick={signIn}>Sign in</button>
    </div>
  )
}

export default App
