interface BoardMarkProps {
  size?: number;
}

export function BoardMark({ size = 44 }: BoardMarkProps) {
    return (
    <div
      style={{ width: size, height: size }}
      className="rounded-md overflow-hidden border border-white/20"
    >
        <img src='default-icon.png' className="flex" style={{ flex: 1, width: size, height: size }} />
    </div>
  );
}
