import { useState } from "react";
import Image from "next/image";

export const ImageModal = ({ isOpen, onClose, imageUrl }: { isOpen: boolean, onClose: () => void, imageUrl: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute w-8 h-8 border-none bg-[rgba(180,83,107,0.11)] rounded transition duration-500 hover:bg-[rgb(211,21,21)] active:bg-[rgb(130,0,0)] top-[-2rem] right-[-2rem]"
          type="button"
        >
          <span className="absolute top-1/2 left-1/2 w-4 h-[1.5px] bg-white transform -translate-x-1/2 rotate-45"></span>
          <span className="absolute top-1/2 left-1/2 w-4 h-[1.5px] bg-white transform -translate-x-1/2 -rotate-45"></span>
        </button>
        <Image src={imageUrl} alt="Chat Image" width={350} height={300} />
      </div>
    </div>
  );
};
