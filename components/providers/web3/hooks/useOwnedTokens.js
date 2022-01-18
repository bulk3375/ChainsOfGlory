import useSWR from "swr"


export const handler = (web3, contract) => (account) => {
    const swrRes = useSWR(() =>
        (web3 && contract && account) ? "web3/ownedTokens" : null,
        async () => {
            const ownedTokens = await contract.gameCoin.contract.methods.balanceOf(account).call()
            console.log(ownedTokens)
            return ownedTokens
        }
    )
    return swrRes
}