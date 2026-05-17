
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

console.log("Terminal Boot Sequence: Initializing Root...");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("CRITICAL: Root element not found");
  throw new Error("Could not find root element to mount to");
}

console.log("Terminal Boot Sequence: Mounting React Application...");
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
console.log("Terminal Boot Sequence: Mounting Complete.");
