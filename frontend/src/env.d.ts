/// <reference types="astro/client" />

import type { Sesion } from '../../backend/lib/auth';

declare global {
  namespace App {
    interface Locals {
      /** La pone el middleware en toda pantalla del panel. */
      sesion?: Sesion;
    }
  }
}

export {};
