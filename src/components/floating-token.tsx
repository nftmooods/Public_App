export function FloatingToken() {
  return (
    <div className="fixed bottom-8 right-8 z-20">
      <div className="relative animate-floating animate-token-pulse">
        <div className="absolute -inset-2 bg-primary/50 rounded-full blur-xl opacity-50"></div>
        <div className="relative bg-primary/90 w-16 h-16 rounded-full flex items-center justify-center border-2 border-primary">
          <span className="text-xl font-bold text-primary-foreground">VST</span>
        </div>
      </div>
    </div>
  );
}
