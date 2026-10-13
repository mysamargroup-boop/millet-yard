
export default function LoadingSpinner({ text = "Loading amazing gifts..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
            <div className="relative">
                {/* Outer Ring */}
                <div className="h-16 w-16 rounded-full border-4 border-primary/20"></div>
                {/* Spinning Inner Ring */}
                <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                {/* Brand Icon or Dot in center (Optional) */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                </div>
            </div>
            <p className="mt-4 text-muted-foreground font-medium animate-pulse">{text}</p>
        </div>
    );
}
