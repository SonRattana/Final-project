import { useState } from "react";
import Image from "next/image";
export const ImageModal = ({ isOpen, onClose, imageUrl }: { isOpen: boolean, onClose: () => void, imageUrl: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 m-2 text-white"
        >
          Close
        </button>
        <Image src={imageUrl} alt="Chat Image" width={800} height={800} />
      </div>
    </div>
  );
};
