import { Logo } from '@/components/shared/Logo';

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-8 mt-auto">
      <div className="container max-w-screen-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo className="text-sm" />
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} StarSage. All rights reserved.
        </p>
        <div className="flex gap-4 text-sm">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
