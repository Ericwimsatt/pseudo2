import { ipcMain } from 'electron';
import * as tooltipService from './tooltipService';
import type { EnrichQuery } from '../translationService/renderable/types';

export function registerTooltipHandlers(): void {
  ipcMain.handle('getNodeDetail', async (_event, arg: { filePath: string; query: EnrichQuery & { identifier?: string } }) => {
    return tooltipService.getNodeDetail(arg);
  });
}
