import { Web3Provider } from "@components/providers";
import { Helmet, HelmetProvider } from "react-helmet-async";

export default function BaseLayout({ children }) {
  return (
    <HelmetProvider>
      <Web3Provider>
        <Helmet
          bodyAttributes={{
            style:
              "background: url( 'images/bkgblend.png' ) center top no-repeat #1b2838;",
          }}
        />
          <div>{children}</div>
      </Web3Provider>
    </HelmetProvider>
  );
}
