import useSound from "use-sound";
import React, { useState } from "react";

import hOver from "@public/images/sounds/r_over3.mp3";
import mClick from "@public/images/sounds/click2.mp3";

export default function ImageButton({
  image,
  imageHover,
  imageClick,
  alt = "",
  buttonId,
  clickFunction
}) {
  const [play] = useSound(hOver);
  const [click] = useSound(mClick);

  const [imgBtn, setImgBtn] = useState(image);

  return (
    <div className="relative">
      <img src={image} alt={alt} width={120} height={141} />
      <img
        className="absolute opacity-10 top-0 left-0 transition hover:opacity-100 transition-opacity duration-200 ease-out"
        src={imgBtn}
        alt={alt}
        width={150}
        height={176}
        onMouseEnter={() => {
          play();
          setImgBtn(imageHover);
        }}
        onMouseLeave={() => setImgBtn(image)}
        onMouseDown={() => setImgBtn(imageClick)}
        onMouseUp={() => setImgBtn(imageHover)}
        onClick={() => {
          click();
          clickFunction(buttonId);
        }}
      />
    </div>
  );
}
