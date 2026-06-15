import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type NewsItem = {
  id: string;
  title: string;
  emoji?: string;
  content: string;
  date?: string;
  cta?: {
    text: string;
    link: string;
    external?: boolean;
  };
};

type NewsSectionProps = {
  section: string;
};

// Module-level cache — news content is static, no need to re-fetch on remount
const newsCache: Record<string, NewsItem[]> = {};

const NewsSection: React.FC<NewsSectionProps> = ({ section }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (newsCache[section]) {
      setNewsItems(newsCache[section]);
      setLoading(false);
      return;
    }

    fetch(`/news/${section}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load news");
        return res.json();
      })
      .then((data) => {
        const items = data.items || [];
        newsCache[section] = items;
        setNewsItems(items);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading news:", err);
        setError(true);
        setLoading(false);
      });
  }, [section]);

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div>
      {loading && (
        <p className="text-gray-500 dark:text-gray-400">
          Loading latest updates...
        </p>
      )}

      {error && (
        <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-500 dark:text-red-400">
            Unable to load updates at this time.
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {newsItems.map((item) => (
            <div
              key={item.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {item.emoji && <span className="mr-2">{item.emoji}</span>}
                  {item.title}
                </h3>
              </div>

              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {item.content}
              </p>

              <div className="mt-3 flex items-center justify-between">
                {item.cta && (
                    <div className="mt-3">
                        {item.cta.external ? (
                        <a
                            href={item.cta.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
                        >
                            {item.cta.text}
                        </a>
                        ) : (
                        <Link
                            to={item.cta.link}
                            className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
                        >
                            {item.cta.text}
                        </Link>
                        )}
                    </div>
                )}
                {item.date && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-auto ml-auto">
                        {formatDate(item.date)}
                    </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsSection;
