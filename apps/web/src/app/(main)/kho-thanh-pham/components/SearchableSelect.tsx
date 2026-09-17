import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export function SearchablePriceListSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn bảng giá..."
}: {
  options: { id: string; tenBangGia: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.tenBangGia.toLowerCase().includes(search.toLowerCase())
  );
  const selectedOption = options.find(o => o.id === value);

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        className="flex items-center justify-between w-full px-2.5 py-1.5 border-2 border-slate-200 rounded-lg text-[10px] bg-slate-50 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate font-semibold text-slate-700">
          {selectedOption ? selectedOption.tenBangGia : placeholder}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
      </div>
      
      {open && (
        <div className="absolute z-50 w-[200%] sm:w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
          <div className="flex items-center px-2 py-1.5 border-b border-slate-100 bg-slate-50">
            <Search className="w-3 h-3 text-slate-400 mr-1.5" />
            <input 
              autoFocus
              type="text" 
              className="w-full text-xs outline-none bg-transparent"
              placeholder="Tìm bảng giá..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            <div 
              className={`px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 ${!value ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-600"}`}
              onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
            >
              (Không chọn)
            </div>
            {filteredOptions.length > 0 ? filteredOptions.map(o => (
              <div 
                key={o.id}
                className={`px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 ${value === o.id ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-600"}`}
                onClick={() => { onChange(o.id); setOpen(false); setSearch(""); }}
              >
                {o.tenBangGia}
              </div>
            )) : (
              <div className="px-3 py-2 text-xs text-slate-400 italic text-center">Không tìm thấy</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
