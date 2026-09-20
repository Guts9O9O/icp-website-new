import { useEffect, useState } from 'react';

// Runs an async fetcher and exposes { data, loading, error }.
// Re-runs when `deps` change; results from a superseded run are ignored, and
// while a new run is in flight the hook reports loading with no data.
export function useData(fetcher, deps = []) {
  const key = JSON.stringify(deps);
  const [state, setState] = useState({ key: null, data: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(fetcher)
      .then((data) => active && setState({ key, data, loading: false, error: null }))
      .catch((error) => active && setState({ key, data: null, loading: false, error }));
    return () => {
      active = false;
    };
    // `fetcher` is intentionally not a dependency: callers pass inline closures
    // and `key` already captures everything they close over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state.key === key ? state : { data: null, loading: true, error: null };
}
