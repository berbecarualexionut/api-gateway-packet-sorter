export function Logo({ name, onTap }: { name: string; onTap: () => void }) {
  return (
    <div className="logo" onPointerDown={onTap}>
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt={`${name} logo`} draggable={false} />
    </div>
  )
}
