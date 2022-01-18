import { useWeb3 } from "@components/providers";

export default function NoAddress({ network }) {
  return (
    <section className="border-slate-400 gradient2 border-2 rounded-lg p-2 mt-2 shadow-md text-white">
      <div className="p-1 ">
        <div className="flex justify-between items-center">
          <h1 className="text-2">Not connected to blockchain</h1>
          <div>
                  Please connect to <strong>{network.targetNetwork}</strong>
            </div>
          </div>
        </div>
    </section>
  );
}
