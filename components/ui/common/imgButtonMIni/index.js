import useSound from "use-sound";
import React, { useState } from "react";

import mClick from "@public/images/sounds/click2.mp3";

export default function ImageButtonMini({
  className,
  image,
  imageClick,
  alt = "",
  buttonId,
  clickFunction
}) {

  const [click] = useSound(mClick);

  const [imgBtn, setImgBtn] = useState(image);

  return (
    <div className="relative">
      <img        
        className={className}
        src={imgBtn}
        alt={alt}
        width={32}
        height={32}
        onMouseDown={() => setImgBtn(imageClick)}
        onMouseUp={() => setImgBtn(image)}
        onClick={() => {
          click();
          clickFunction(buttonId);
        }}
      />
    </div>
  );
}
