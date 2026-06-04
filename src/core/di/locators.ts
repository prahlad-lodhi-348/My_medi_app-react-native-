// Simple service locator to keep dependencies explicit.
// If you prefer full-blown DI, swap this with Inversify.

import { AuthService } from '../services/authService';
import { ApiClient } from '../api/client';

export type ServiceLocators = {
  apiClient: ApiClient;
  authService: AuthService;
};

let services: ServiceLocators | null = null;

export const getServices = (): ServiceLocators => {
  if (services) return services;

  // These modules are side-effect free.
  const { apiClient } = require('../api/client');
  const { authService } = require('../services/authService');

  services = {
    apiClient,
    authService,
  };

  return services;
};

