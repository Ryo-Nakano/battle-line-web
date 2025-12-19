import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const urlParams = new URLSearchParams(window.location.search);
const playerID = urlParams.get('playerID') || undefined;
const matchID = urlParams.get('matchID') || 'default';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App playerID={playerID} matchID={matchID} />
  </StrictMode>,
)
