/**
 * Utility functions for Shadcn UI components
 */

export type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  function process(item: ClassValue) {
    if (!item) return;
    if (typeof item === 'string' || typeof item === 'number') {
      classes.push(String(item));
    } else if (Array.isArray(item)) {
      item.forEach(process);
    } else if (typeof item === 'object') {
      for (const [key, val] of Object.entries(item)) {
        if (val) classes.push(key);
      }
    }
  }

  inputs.forEach(process);
  return classes.join(' ');
}
