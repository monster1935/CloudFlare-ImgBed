import { useParams } from 'react-router-dom'

export default function PublicBrowse() {
  const { '*': dir } = useParams()

  return (
    <div className="container mx-auto max-w-6xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Browse</h1>
      <p className="text-muted-foreground">Directory: /{dir || ''}</p>
    </div>
  )
}
