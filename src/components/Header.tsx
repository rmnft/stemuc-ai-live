import { Music } from "lucide-react";
import { cn } from "@/lib/utils";

const Header = () => {
  return (
    <header className="w-full px-6 py-4 flex justify-between items-center z-10">
      <div className="flex items-center">
        <div className="relative h-8 w-8 mr-3">
          <div className="absolute inset-0 rounded-full bg-red-600/20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="h-5 w-5 text-red-500" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-red-500">Stem</span>
            <span className="text-white">uc</span>
          </h1>
        </div>
      </div>
      <div></div>
    </header>
  );
};

export default Header;
