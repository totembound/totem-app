import React, { useEffect, useState } from 'react';

type LegalDocProps = {
  doc: 'terms' | 'privacy';
};

const LegalDocument: React.FC<LegalDocProps> = ({ doc }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const lang = navigator.language.slice(0, 2); // 'en', 'es', 'fr'
  const supportedLangs = ['en', 'es', 'fr'];
  const safeLang = supportedLangs.includes(lang) ? lang : 'en';

  const url = `/legal${safeLang !== 'en' ? `/${safeLang}` : ''}/${doc}.html`;

  useEffect(() => {
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.text();
      })
      .then((html) => {
        setContent(html);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [url]);

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg">
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Sorry, we couldn’t load the document.</p>}
      {!loading && !error && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
};

export default LegalDocument;
