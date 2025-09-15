import React, { useRef, useEffect } from 'react';

interface Live2DAvatarProps {
  initialize: (canvas: HTMLCanvasElement) => void;
  width?: number;
  height?: number;
}

const Live2DAvatar: React.FC<Live2DAvatarProps> = ({
  initialize,
  width = 400,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Pass the canvas element to the initialization function
      initialize(canvasRef.current);
    }
  }, [initialize]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block' }}
    />
  );
};

export default Live2DAvatar;
