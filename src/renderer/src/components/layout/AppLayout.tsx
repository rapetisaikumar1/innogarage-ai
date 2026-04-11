import { Outlet } from 'react-router-dom'
import Titlebar from './Titlebar'

export default function AppLayout(): React.JSX.Element {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Titlebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
