import { initCore } from './modules/core/init';
import GlosaSearch from './components/GlosaSearch';

// Main entry point for the application logic
export function initializeApp() {
    initCore();
}

function App() {
  return (
    <div>
      {/* ...eventuellt annan layout... */}
      <GlosaSearch />
    </div>
  );
}
