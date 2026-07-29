import { ipcMain } from 'electron';
import * as tooltipService from './tooltipService';
import type { EnrichQuery } from '../translationService/renderable/types';

// MIGRATION BOUNDARY: This handler serves the React renderer.
// After React removal, delete this and use getTooltipFragment.
export function registerTooltipHandlers(): void {
  ipcMain.handle('getNodeDetail', async (_event, arg: { filePath: string; query: EnrichQuery & { identifier?: string } }) => {
    return tooltipService.getNodeDetail(arg);
  });
}
