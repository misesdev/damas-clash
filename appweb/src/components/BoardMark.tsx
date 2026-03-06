interface BoardMarkProps {
  size?: number;
}

export function BoardMark({ size = 44 }: BoardMarkProps) {
  const cellSize = size / 4;
  const cells = [
    [false, true, false, true],
    [true, false, true, false],
    [false, true, false, true],
    [true, false, true, false],
  ];

  return (
    <div
      style={{ width: size, height: size }}
      className="grid grid-cols-4 rounded-md overflow-hidden border border-white/20"
    >
      {cells.flat().map((dark, i) => (
        <div
          key={i}
          style={{ width: cellSize, height: cellSize }}
          className={dark ? 'bg-white' : 'bg-black'}
        />
      ))}
    </div>
  );
}
