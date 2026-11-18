import { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState('vérification…');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('injoignable'));
  }, []);

  return (
    <main className="container">
      <div className="card">
        <h1>Carnet de Recettes</h1>
        <p className="muted">État de l'API : {status}</p>
      </div>
    </main>
  );
}

export default App;