import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getServerUrl = () => {
  const { protocol, hostname } = window.location;
  return import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_SERVER_URL || `${protocol}//${hostname}:8000`;
};
