import { useState, useEffect, useCallback } from 'react';

export function useBotchan(feedName = 'survive-game') {
  const [feed, setFeed]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [online, setOnline]   = useState(true);

  const fetchFeed = useCallback(async (name = feedName, limit = 10) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/botchan/feed?feed=${encodeURIComponent(name)}&limit=${limit}`);
      const data = await res.json();
      setFeed(data.posts ?? (Array.isArray(data) ? data : []));
      setError(null);
      setOnline(true);
    } catch (err) {
      setError(err.message);
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, [feedName]);

  const post = useCallback(async (name, message, data = {}) => {
    try {
      const res = await fetch('/api/botchan/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feed: name, message, data }),
      });
      return await res.json();
    } catch (err) {
      console.error('[useBotchan] post failed:', err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const fetchPostsByAddress = useCallback(async (address) => {
    try {
      const res  = await fetch(`/api/botchan/posts?address=${encodeURIComponent(address)}`);
      return await res.json();
    } catch {
      return [];
    }
  }, []);

  // Initial fetch + 2-minute refresh
  useEffect(() => {
    fetchFeed();
    const id = setInterval(() => fetchFeed(), 2 * 60_000);
    return () => clearInterval(id);
  }, [fetchFeed]);

  return { feed, loading, error, online, fetchFeed, post, fetchPostsByAddress };
}
