import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/session/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/session/$id"!</div>
}
