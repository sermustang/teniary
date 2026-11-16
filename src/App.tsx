import { createHashRouter, Navigate, Outlet, RouterProvider, ScrollRestoration, useLocation } from 'react-router'
import { UpdateBanner } from './components/Banners'
import { NoteForm } from './pages/NoteForm'
import { NotesList } from './pages/NotesList'
import { NoteView } from './pages/NoteView'
import { Settings } from './pages/Settings'
import { AppStateProvider } from './state'

function Layout() {
  const { pathname } = useLocation()
  // Don't offer to reload for an update while a form is open.
  const inForm = pathname === '/nueva' || pathname.endsWith('/editar')
  return (
    <>
      <Outlet />
      <UpdateBanner hidden={inForm} />
      <ScrollRestoration />
    </>
  )
}

// Hash routes (#/nota/…) work on GitHub Pages without any server setup.
const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <NotesList /> },
      { path: 'nueva', element: <NoteForm mode="new" /> },
      { path: 'nota/:id', element: <NoteView /> },
      { path: 'nota/:id/editar', element: <NoteForm mode="edit" /> },
      { path: 'ajustes', element: <Settings /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return (
    <AppStateProvider>
      <RouterProvider router={router} />
    </AppStateProvider>
  )
}
