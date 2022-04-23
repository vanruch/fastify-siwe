import './App.css'
import { providers } from 'ethers'
import { SiweMessage } from 'siwe';
import { useEffect, useState } from 'react';

async function getNonce(): Promise<string> {
  const req = await fetch('http://localhost:3001/siwe/init', { method: 'POST' })
  const { nonce } = await req.json()
  return nonce
}

async function checkAuthStatus(): Promise<{
  message?: SiweMessage,
}> {
  const token = localStorage.getItem('authToken')

  const req = await fetch('http://localhost:3001/siwe/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return await req.json()
}

function App() {
  const [message, setMessage] = useState<SiweMessage | undefined>()

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

    localStorage.setItem('authToken', JSON.stringify({ signature, message }));

    checkAuthStatus().then((res) => setMessage(res?.message))
  }

  function signOut() {
    localStorage.removeItem('authToken')
    setMessage(undefined)
  }

  useEffect(() => {
    checkAuthStatus().then((res) => setMessage(res?.message))
  }, [])

  return (
    <div className="App">
      <button onClick={signIn}>{!message ? 'Sign in' : 'Sign in again'}</button>
      <button disabled={!message} onClick={signOut}>Sign out</button>
      {message ? (
        <>
          <p>Logged in with {message.address}</p>
          <p>Nonce: {message.nonce}</p>
          <p>IssuedAt: {message.issuedAt}</p>
        </>
      ) : <p>Not logged in :(</p>}
    </div>
  )
}

export default App
