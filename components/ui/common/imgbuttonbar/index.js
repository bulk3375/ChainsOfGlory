import { ImageButton } from "..";

export default function ImageButtonBar({ clickFunction, network }) {  

  return (
    <div className="flex justify-between items-center mt-4">
      {network.hasInitialResponse && network.isSupported ? (
        <>
          <ImageButton
            image="/images/icons/heroes.png"
            imageHover="/images/icons/heroesHo.png"
            imageClick="/images/icons/heroesCl.png"
            alt="Ejemplo de imagen"
            buttonId="3"
            clickFunction={clickFunction}
          />

          <ImageButton
            image="/images/icons/equipment.png"
            imageHover="/images/icons/equipmentHo.png"
            imageClick="/images/icons/equipmentCl.png"
            alt="Ejemplo de imagen"
            buttonId="1"
            clickFunction={clickFunction}
          />

          <ImageButton
            image="/images/icons/quests.png"
            imageHover="/images/icons/questsHo.png"
            imageClick="/images/icons/questsCl.png"
            alt="Ejemplo de imagen"
            buttonId="2"
            clickFunction={clickFunction}
          />

          <ImageButton
            image="/images/icons/merchant.png"
            imageHover="/images/icons/merchantHo.png"
            imageClick="/images/icons/merchantCl.png"
            alt="Ejemplo de imagen"
            buttonId="4"
            clickFunction={clickFunction}
          />
          <ImageButton
            image="/images/icons/auction.png"
            imageHover="/images/icons/auctionHo.png"
            imageClick="/images/icons/auctionCl.png"
            alt="Ejemplo de imagen"
            buttonId="6"
            clickFunction={clickFunction}
          />
        </>
      ) : (
        <>
          <img src="/images/icons/heroesDi.png" width={120} height={141} />
          <img src="/images/icons/equipmentDi.png" width={120} height={141} />
          <img src="/images/icons/questsDi.png" width={120} height={141} />
          <img src="/images/icons/merchantDi.png" width={120} height={141} />
          <img src="/images/icons/auctionDi.png" width={120} height={141} />
        </>
      )}

      <ImageButton
        image="/images/icons/ranking.png"
        imageHover="/images/icons/rankingHo.png"
        imageClick="/images/icons/rankingCl.png"
        alt="Ejemplo de imagen"
        buttonId="5"
        clickFunction={clickFunction}
      />

      <ImageButton
        image="/images/icons/help.png"
        imageHover="/images/icons/helpHo.png"
        imageClick="/images/icons/helpCl.png"
        alt="Ejemplo de imagen"
        buttonId="0"
        clickFunction={clickFunction}
      />
    </div>
  );
}
