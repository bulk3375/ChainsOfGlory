import { useWeb3 } from "@components/providers";

export default function Address({ address, network }) {
  const { requireInstall } = useWeb3();
  return (
    <section className="border-slate-400 gradient1 border-2 rounded-lg p-2 mt-2 shadow-md text-white">
      <div className="p-1 ">
        <div className="flex justify-between items-center">
          <h1 className="text-2">Hello, {address}</h1>
          <div>
            {network.hasInitialResponse && !network.isSupported ? (
              <>
                <div className="text-white rounded-lg p-2 px-4 bg-yellow-600 border-slate-300 border-2 shadow-lg">
                  Wrong network. Connect to:{" "}
                  <strong className="text-xl">{network.targetNetwork}</strong>
                </div>
              </>
            ) : requireInstall ? (
              <div className="bg-yellow-500 p-4 rounded-lg">
                Cannot connect to network. Please install Metamask.
              </div>
            ) : (
              network.data && (
                <>
                  <span>Currently on </span>
                  <strong className="text-xl">{network.data}</strong>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
