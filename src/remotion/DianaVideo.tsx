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
              
              {/* Text Overlays */}
              <AbsoluteFill style={{ 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.2)'
              }}>
                <div style={{
                  color: 'white',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  textAlign: 'center',
                  opacity: interpolate(
                    frame - startFrame,
                    [10, 25, framesPerImage - 25, framesPerImage - 10],
                    [0, 1, 1, 0],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                  )
                }}>
                  <h1 style={{ 
                    fontSize: 120, 
                    fontWeight: 900, 
                    margin: 0, 
                    letterSpacing: '-0.05em',
                    textTransform: 'uppercase'
                  }}>DianaLoja</h1>
                  <p style={{ 
                    fontSize: 40, 
                    fontWeight: 700, 
                    margin: 0, 
                    letterSpacing: '0.4em',
                    color: '#827b14',
                    textTransform: 'uppercase'
                  }}>Nova Coleção</p>
                </div>
              </AbsoluteFill>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
