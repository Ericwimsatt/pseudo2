import { test, expect, type Page } from '@playwright/test';
import { buildFileData } from '../src/lib/buildFileData';

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
    localStorage.setItem('repoPath', '/tmp/auth');
    const tree = [{ name: 'AuthContext.tsx', path: 'AuthContext.tsx', type: 'file' as const }];
    (window as any).electronAPI = {
      loadProject: async ({ path: _p }: { path: string }) => ({ tree, path: '/tmp/auth' }),
      getTree: async () => ({ tree }),
      loadFileSource: async ({ path: _p }: { path: string }) => ({ path: 'AuthContext.tsx', lines: data.sourceLines }),
      loadFileTranslation: async ({ path: _p }: { path: string }) => ({ viewModel: data.viewModel, path: 'AuthContext.tsx' }),
      browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
      uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: '/tmp/auth' }),
      openDirectorySelector: async () => null,
      onMenuLoadFolder: () => () => {},
    };
  }, { viewModel, sourceLines });
  await page.goto('http://localhost:5174/');
}

test.describe('AuthContext.tsx renders without crashing', () => {
  test('all node types in the file produce display spans', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await loadApp(page);
    await page.getByText('AuthContext.tsx', { exact: false }).first().click();

    // Representative translations across the constructs in this file.
    await expect(page.locator('body')).toContainText('Interface AuthContextType');
    await expect(page.locator('body')).toContainText('Function AuthProvider');
    await expect(page.locator('body')).toContainText('Call createContext');
    await expect(page.locator('body')).toContainText('Call useState');
    await expect(page.locator('body')).toContainText('Return Visual Elements:');

    // No uncaught render errors (the reported TypeError would surface here).
    expect(pageErrors).toEqual([]);

    await page.screenshot({ path: 'test/screenshots/auth-context.png', fullPage: true });
  });
});
