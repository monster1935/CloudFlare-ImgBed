export default function BlockImage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">Image Blocked</h1>
        <p className="text-muted-foreground">This image has been blocked by the administrator.</p>
      </div>
    </div>
  )
}
