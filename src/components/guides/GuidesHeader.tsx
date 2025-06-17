import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Tooltip from "../Tooltip";

const GuidesHeader = ({ title }: { title: string }) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h1>
      <Link
        to="/guides"
        className="inline-flex items-center text-purple-500 hover:text-purple-400 text-sm font-medium"
      >
        <Tooltip content="Back to Guides">
          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 flex items-center justify-center transition-colors">
            <ChevronLeft size={20} />
          </div>
        </Tooltip>
      </Link>
    </div>
  );
};

export default GuidesHeader;
