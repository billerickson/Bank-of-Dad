/// <reference types="astro/client" />

declare const __APP_BUILD_ID__: string;

declare namespace App {
  interface Locals {
    isInitialized: boolean;
    isAuthenticated: boolean;
  }
}
