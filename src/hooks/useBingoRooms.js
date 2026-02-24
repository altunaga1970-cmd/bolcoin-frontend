/**
 * useBingoRooms Hook
 *
 * Polls /api/bingo/rooms every 3 seconds.
 * Calculates local countdown (updates every second via setInterval).
 * Uses phaseEndTime from server for all phase countdowns.
 * Returns: { rooms, isLoading, jackpot }
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import bingoApi from '../api/bingoApi';

const POLL_INTERVAL = 3000;
const COUNTDOWN_TICK = 1000;

export function useBingoRooms() {
  const [rooms, setRooms] = useState([]);
  const [jackpot, setJackpot] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const roomsRef = useRef([]);

  // Fetch rooms from backend
  const fetchRooms = useCallback(async () => {
    try {
      const data = await bingoApi.getRooms();
      const fetchedRooms = data.rooms || [];
      roomsRef.current = fetchedRooms;
      setRooms(fetchedRooms);
      setJackpot(data.jackpot || 0);
      setIsLoading(false);

      // Update countdowns from phaseEndTime (covers all phases)
      const newCountdowns = {};
      fetchedRooms.forEach(room => {
        if (room.phase === 'drawing' && room.drawStartedAt) {
          // For drawing phase, show elapsed ball count instead of countdown
          const elapsed = Date.now() - new Date(room.drawStartedAt).getTime();
          const ballIndex = Math.min(Math.floor(elapsed / 4500), 74);
          newCountdowns[room.roomNumber] = ballIndex + 1; // 1-based ball number
        } else {
          const endTime = room.phaseEndTime || room.scheduledClose;
          if (endTime) {
            const diffMs = new Date(endTime).getTime() - Date.now();
            newCountdowns[room.roomNumber] = Math.max(0, Math.floor(diffMs / 1000));
          } else {
            newCountdowns[room.roomNumber] = 0;
          }
        }
      });
      setCountdowns(newCountdowns);
    } catch (err) {
      console.warn('[useBingoRooms] Error fetching rooms:', err);
      setIsLoading(false);
    }
  }, []);

  // Poll rooms
  useEffect(() => {
    fetchRooms();
    const pollId = setInterval(fetchRooms, POLL_INTERVAL);
    return () => clearInterval(pollId);
  }, [fetchRooms]);

  // Local countdown tick (every second)
  useEffect(() => {
    const tickId = setInterval(() => {
      setCountdowns(prev => {
        const next = {};
        const currentRooms = roomsRef.current;
        for (const key of Object.keys(prev)) {
          const room = currentRooms.find(r => String(r.roomNumber) === key);
          if (room && room.phase === 'drawing' && room.drawStartedAt) {
            // For drawing: recalculate ball number from server timestamp
            const elapsed = Date.now() - new Date(room.drawStartedAt).getTime();
            next[key] = Math.min(Math.floor(elapsed / 4500) + 1, 75);
          } else {
            next[key] = Math.max(0, prev[key] - 1);
          }
        }
        return next;
      });
    }, COUNTDOWN_TICK);
    return () => clearInterval(tickId);
  }, []);

  // Merge countdowns into rooms
  const roomsWithCountdown = rooms.map(room => ({
    ...room,
    countdown: countdowns[room.roomNumber] || 0,
  }));

  return {
    rooms: roomsWithCountdown,
    isLoading,
    jackpot,
    refetch: fetchRooms,
  };
}

export default useBingoRooms;
