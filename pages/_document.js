import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
     <Head>
        {/* --- PLACE YOUR TAGS HERE --- */}
        <meta name="google-site-verification" content="o_ZP7Gh228bnvaAsyMyjC4LDXViRYDT5ic31HO4qgOM" />
        <title>Yumzy - Daffodil Smart City’s Food & Grocery Solution</title>
        <meta name="description" content="Yumzy lets Daffodil Smart City residents order food and groceries quickly and conveniently." />
        {/* --- END OF YOUR TAGS --- */}

       
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
