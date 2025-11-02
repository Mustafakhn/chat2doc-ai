import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <meta name="description" content="Chat2Doc - AI-powered document analysis and intelligent conversations with your documents. Upload PDF, DOCX, and text files to get instant insights." />
                <meta name="keywords" content="AI, document analysis, PDF, DOCX, chat, intelligence, research, business" />
                <meta name="author" content="Chat2Doc" />
                <meta property="og:title" content="Chat2Doc - AI Document Intelligence" />
                <meta property="og:description" content="Transform your documents into intelligent conversations with AI-powered analysis." />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Chat2Doc - AI Document Intelligence" />
                <meta name="twitter:description" content="Transform your documents into intelligent conversations with AI-powered analysis." />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
