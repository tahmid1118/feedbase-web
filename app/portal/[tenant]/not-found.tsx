export default function PortalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdf8f9] px-6 text-center">
      <h1 className="text-3xl font-bold text-[#1c0a0c]">Workspace not found</h1>
      <p className="mt-2 max-w-md text-[#1c0a0c]/60">
        This feedback portal doesn&apos;t exist or is no longer active. Please
        check the address and try again.
      </p>
    </div>
  );
}
