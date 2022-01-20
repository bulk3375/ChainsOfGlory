export default function InventoryList({ListValues, children}) {
    
    return (
        <section className="grid md:grid-cols-4 lg:grid-cols-4 gap-4 mb-5">
            { ListValues && ListValues.map(NFT => children(NFT) )}
        </section>
    )
}