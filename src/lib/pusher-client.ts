import Pusher from 'pusher-js';

let pusher: Pusher | null = null;

// One browser connection shared by every subscriber; callers unsubscribe from their channel but never disconnect.
export const getPusherClient = () =>
  (pusher ??= new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! }));
