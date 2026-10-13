"use client";

export default function AdminFooter() {
  return (
    <footer className="py-3 px-6 border-t border-border/10 glass-panel text-center flex-shrink-0">
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} Admin Panel •
        <a href="/" target="_blank" className="text-[#137fec] hover:underline ml-1">
          View Store
        </a>
      </p>
    </footer>
  );
}
