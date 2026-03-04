import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Img, staticFile, Sequence } from 'remotion';

export const DianaVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const images = [
    staticFile('assets/fashion/fashion_1.png'),
    staticFile('assets/fashion/fashion_2.png'),
    staticFile('assets/fashion/fashion_3.png'),
  ];

  const framesPerImage = durationInFrames / images.length;

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {images.map((img, i) => {
        const startFrame = i * framesPerImage;
        return (
          <Sequence key={i} from={startFrame} durationInFrames={framesPerImage + 15}>
            <AbsoluteFill>
              <Img
                src={img}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: interpolate(
                    frame - startFrame,
                    [0, 15, framesPerImage - 15, framesPerImage],
                    [0, 1, 1, 0],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                  ),
                  transform: `scale(${interpolate(
                    frame - startFrame,
                    [0, framesPerImage],
                    [1, 1.1]
                  )})`,
                }}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
