import { ChangelogManager } from "@/components/changelog/changelog-manager";

export default function ChangelogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">Changelog</h2>
        <p className="text-sm text-[#1c0a0c]/60">
          Publish product updates and release notes
        </p>
      </div>

      <ChangelogManager />
    </div>
  );
}
