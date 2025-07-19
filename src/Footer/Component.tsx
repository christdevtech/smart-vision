export default function Footer() {
  return (
    <footer className="flex flex-col gap-2 items-center pt-5 mt-8 border-t border-white/10">
      <p className="m-0 text-sm text-white/60">
        © 2024 SmartVision - Empowering Secondary Education
      </p>
      <div className="flex gap-2 items-center text-xs text-white/50 md:flex-col md:gap-1">
        <span>Supports MTN & Orange Money</span>
        <span className="md:hidden">•</span>
        <span>Referral Rewards Available</span>
      </div>
    </footer>
  )
}
