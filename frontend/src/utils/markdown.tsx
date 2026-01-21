import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-a:text-blue-400 prose-code:text-pink-400 prose-pre:bg-zinc-800 prose-headings:text-white prose-p:text-white prose-strong:text-white prose-li:text-white">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 text-white">{children}</p>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
