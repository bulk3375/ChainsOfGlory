import React, { useState, useEffect } from "react";

const useAudio = (url) => {
  const audio = null;
  if (typeof Audio !== "undefined") [audio] = useState(new Audio(url));

  const [playing, setPlaying] = useState(false);

  const toggle = () => setPlaying(!playing);

  useEffect(() => {
    playing ? audio.play() : audio.pause();
  }, [playing]);

  useEffect(() => {
    audio.addEventListener("ended", () => setPlaying(false));
    return () => {
      audio.removeEventListener("ended", () => setPlaying(false));
    };
  }, []);

  return [playing, toggle];
};

const Player = ({ url }) => {
  const [playing, toggle] = useAudio(url);
    
  return (
    <div className="ml-8">
      <img
        src={
          playing ? "/images/icons/soundoff.png" : "/images/icons/soundon.png"
        }
        width={32}
        height={32}
        onClick={toggle}
      />
    </div>
  );
};

export default Player;
