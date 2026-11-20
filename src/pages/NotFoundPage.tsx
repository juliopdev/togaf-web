import { ButtonLink, PageHeader } from '../components/ui'

export default function NotFoundPage() {
  return (
    <div className="py-12 text-center">
      <PageHeader title="Página no encontrada">
        <span className="block">Ese enlace no lleva a ninguna fase ni tema.</span>
      </PageHeader>
      <div className="flex justify-center gap-2">
        <ButtonLink to="/">Ir al inicio</ButtonLink>
        <ButtonLink to="/adm" variant="secondary">
          Ver la rueda ADM
        </ButtonLink>
      </div>
    </div>
  )
}
