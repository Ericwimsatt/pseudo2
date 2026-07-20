// fallow-ignore-file unused-file

interface Profile {
  startTime: number;
  lastTime: number;
  message: string;
}

const profiles = new Map<string, Profile>();

export const Profiler = {
  new(key: string, message?: string) {
    const now = performance.now();
    profiles.set(key, { startTime: now, lastTime: now, message: message ?? '' });
    console.log('Start', message ?? '', 0, 0);
  },

  addLog(key: string, spanName: string) {
    const profile = profiles.get(key);
    if (!profile) {
      console.log(key, spanName, 'Time since last span', 'Time since start');
      return;
    }
    const now = performance.now();
    const timeSinceStart = now - profile.startTime;
    const timeSinceLast = now - profile.lastTime;
    profile.lastTime = now;
    console.log(spanName, timeSinceStart, timeSinceLast);
  },

  close(key: string) {
    const profile = profiles.get(key);
    if (!profile) {
      console.log('No profile found for key:', key);
      return;
    }
    const now = performance.now();
    console.log('Total time for', key, profile.message, ':', now - profile.startTime);
    profiles.delete(key);
  },
};
