'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import apiClient from '@/lib/api';

interface Props {
  slug: string;
  defaultTitle: string;
}

export default function StaticPageView({ slug, defaultTitle }: Props) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState(defaultTitle);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/pages/${slug}/`)
      .then((res) => {
        setTitle(res.data.title);
        setContent(res.data.content);

        const injectHTML = (htmlString: string, targetNode: HTMLElement) => {
          if (!htmlString) return;
          const container = document.createElement('div');
          container.innerHTML = htmlString;
          Array.from(container.childNodes).forEach((node) => {
            if (node.nodeName.toLowerCase() === 'script') {
              const scriptParams = node as HTMLScriptElement;
              const newScript = document.createElement('script');
              Array.from(scriptParams.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
              newScript.appendChild(document.createTextNode(scriptParams.innerHTML));
              targetNode.appendChild(newScript);
            } else {
              targetNode.appendChild(node.cloneNode(true));
            }
          });
        };

        // Inject safely by manually recreating script tags
        injectHTML(res.data.custom_head, document.head);
        injectHTML(res.data.custom_body_end, document.body);
      })
      .catch((err) => {
        console.error(`Failed to load dynamic page ${slug}:`, err);
        setContent(`<p>Could not load ${defaultTitle}. Please try again later.</p>`);
      })
      .finally(() => setLoading(false));

    // Cleanup function to remove injected scripts/styles when navigating away
    return () => {
      // In a real robust system, we would track injected nodes and remove them.
      // But adding/removing native tags cleanly usually requires custom tagging.
    };
  }, [slug]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fafafa' }}>
      <Header />
      <main style={{ flex: 1, padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', padding: '4rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <span className="spinner dark" style={{ width: '2rem', height: '2rem' }} />
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem', color: '#0f172a' }}>{title}</h1>
              <div 
                className="prose"
                style={{ color: '#64748b', lineHeight: 1.8, fontSize: '1rem' }}
                dangerouslySetInnerHTML={{ __html: content }} 
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
