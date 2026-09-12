export default function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 py-6 dark:border-zinc-800">
      <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
        © {new Date().getFullYear()} 내게맞는할인. All rights reserved.
      </p>
    </footer>
  );
}
