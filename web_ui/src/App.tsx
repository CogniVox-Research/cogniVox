import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Navigate,
  Outlet,
} from '@tanstack/react-router';
import { LoginPage } from './features/auth';
import { RegisterPage } from './features/auth';
import { PairingPage } from './features/pairing';
import { OptionsPage } from './features/options';

// ─── Route tree (manual — no Vite plugin needed) ───────────────────────────
const rootRoute = createRootRoute({
  component: Outlet,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/login" />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

const pairingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pair',
  component: PairingPage,
});

const optionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/options',
  component: OptionsPage,
});

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, registerRoute, pairingRoute, optionsRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  return <RouterProvider router={router} />;
}
