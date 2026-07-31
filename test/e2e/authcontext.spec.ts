// @smoke @p0 @core:rendering
import { test, expect, type Page } from '@playwright/test';
import { buildFileData } from '../../src/main/translationService/buildFileData';
import {
  templatePrefix,
  renderTemplate,
} from '../fixtures/phrasingRules';

// Derived from config/phrasing-rules.json so wording edits don't churn this smoke test.
const TYPE_PREFIX = templatePrefix('interface').trim();
const FN_PREFIX = templatePrefix('function-definition').trim();
const CALL_PREFIX = templatePrefix('call-function').trim();
const RETURN_JSX = renderTemplate('return-jsx', {});

// Real-world file reported as crashing DisplayNode (node.spans undefined).
const SOURCE = `import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
`;

async function loadApp(page: Page) {
  const viewModel = buildFileData(SOURCE, 'AuthContext.tsx').viewModel;
  // Every rendered node must be in display-span shape.
  for (const line of viewModel.lines) {
    for (const node of line.nodes) {
      expect(Array.isArray(node.spans)).toBeTruthy();
    }
  }
  const sourceLines = viewModel.lines.map((l) => ({ lineNumber: l.lineNumber, text: l.sourceText }));
  await page.addInitScript((data) => {
    const tree = [{ name: 'AuthContext.tsx', path: 'AuthContext.tsx', type: 'file' as const }];
    (window as any).electronAPI = {
      loadProject: async ({ path: _p }: { path: string }) => ({ tree, path: '/tmp/auth' }),
      getTree: async () => ({ tree }),
      loadFileSource: async ({ path: _p }: { path: string }) => ({ path: 'AuthContext.tsx', lines: data.sourceLines }),
      loadFileTranslation: async ({ path: _p }: { path: string }) => ({ viewModel: data.viewModel, path: 'AuthContext.tsx' }),
      browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
      uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: '/tmp/auth' }),
      openDirectorySelector: async () => null,
      getLastProjectPath: async () => '/tmp/auth',
      setLastProjectPath: async (_path: string) => {},
      clearLastProjectPath: async () => {},
      onMenuLoadFolder: () => () => {},
      getLastFilePath: async () => '',
      setLastFilePath: async (_path: string) => {},
      clearLastFilePath: async () => {},
    };
  }, { viewModel, sourceLines });
  await page.goto('http://localhost:5174/');
}

test.describe('AuthContext.tsx renders without crashing @smoke @p0 @core:rendering', () => {
  test('all node types in the file produce display spans', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await loadApp(page);
    await page.getByText('AuthContext.tsx', { exact: false }).first().click();

    // Representative translations across the constructs in this file.
    await expect(page.locator('body')).toContainText(`${TYPE_PREFIX} AuthContextType`);
    await expect(page.locator('body')).toContainText(`${FN_PREFIX} AuthProvider`);
    await expect(page.locator('body')).toContainText(`${CALL_PREFIX} createContext`);
    await expect(page.locator('body')).toContainText(`${CALL_PREFIX} useState`);
    await expect(page.locator('body')).toContainText(RETURN_JSX);

    // No uncaught render errors (the reported TypeError would surface here).
    expect(pageErrors).toEqual([]);

    await page.screenshot({ path: 'test/screenshots/auth-context.png', fullPage: true });
  });
});
