// Default import
import React from 'react';

// Named import
import { useState, useEffect } from 'react';

// Namespace import
import * as ReactRouter from 'react-router-dom';

// Type import
import type { FC, ReactNode } from 'react';

// Dynamic import (commented since it's runtime-only in the fixture)
// const moment = await import('moment');

// Re-export
export { useState, useEffect } from 'react';

// Export default
export default function Main() {
  return null;
}

// Export named
export function helper() {
  return 'helper';
}
