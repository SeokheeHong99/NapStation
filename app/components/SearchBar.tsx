type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <input
        aria-label="Search nap spots"
        placeholder="Search by name, building, or tag"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="search-chip">UBC</div>
    </div>
  );
}
