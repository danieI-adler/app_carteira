export default function BackgroundPattern() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dot Matrix Pattern */}
      <div className="absolute inset-0 dot-grid-pattern mask-radial-faded opacity-80"></div>

      {/* Atmospheric Glow Orbs */}
      <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px]"></div>
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[160px]"></div>
      <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[160px]"></div>
    </div>
  )
}
