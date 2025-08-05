import React, { ReactNode, useEffect, useState } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type SessionCentralAnimationProps = {
  progress: number;      // 0 … 1 externally controlled
  isPaused: boolean;
  isEnded: boolean;
  size?: number;
  thickness?: number;
  glowWidth?: number;    // additional width allocated for the halo
  children?: ReactNode;
};

export const SessionCentralAnimation: React.FC<SessionCentralAnimationProps> = ({
  progress,
  isPaused,
  isEnded,
  size = 220,
  thickness = 18,
  glowWidth = 2,        // default halo expansion
  children,
}) => {
  const segmentRatio = 0.8;
  const color = isEnded ? '#FFD700' : isPaused ? '#42a5f5' : '#39e622';
  const bgColor = '#333';

  const cx = size / 2;
  const cy = size / 2;

  // radius for main arc
  const radiusMain = cx - thickness / 2;
  // radius for halo arc: reduce radius by half the extra width to keep the outer edge within bounds
  const radiusGlow = cx - (thickness + glowWidth) / 2;

  const totalAngle = 2 * Math.PI * segmentRatio;
  const startAngle = -Math.PI / 2 - totalAngle / 2;

  // generalised polar converter
  function polarToXY(angle: number, radius: number) {
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }

  // generalised arc descriptor
  function describeArc(start: number, end: number, radius: number) {
    const s = polarToXY(start, radius);
    const e = polarToXY(end, radius);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return [`M ${s.x} ${s.y}`, `A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`].join(' ');
  }

  // Animated progress interpolation
  const [animatedProgress] = useState(() => new Animated.Value(progress));
  const [displayProgress, setDisplayProgress] = useState(progress);
  useEffect(() => {
    const id = animatedProgress.addListener(({ value }) => setDisplayProgress(value));
    return () => animatedProgress.removeListener(id);
  }, [animatedProgress]);
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 600,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Halo animation: vary stroke width and opacity smoothly
  const [glowAnim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ]),
    ).start();
  }, []);
  const glowStrokeWidth = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [thickness, thickness + glowWidth],
  });
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // Paths for background, halo and main arcs
  const arcEnd = startAngle + totalAngle * displayProgress;
  const bgPath = describeArc(startAngle, startAngle + totalAngle, radiusMain);
  const fgPath = describeArc(startAngle, arcEnd, radiusMain);
  const glowPath = describeArc(startAngle, arcEnd, radiusGlow);

  // Scale animation when paused
  const [pulse] = useState(new Animated.Value(1));
  useEffect(() => {
    if (isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [isPaused]);

  const AnimatedPath = Animated.createAnimatedComponent(Path);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        alignSelf: 'center',
        justifyContent: 'center',
        transform: [{ scale: pulse }],
      }}
    >
      <View style={StyleSheet.absoluteFillObject}>
        <Svg width={size} height={size}>
          {/* full background arc */}
          <Path
            d={bgPath}
            stroke={bgColor}
            strokeWidth={thickness}
            strokeLinecap="round"
            fill="none"
          />
          {/* halo arc */}
          <AnimatedPath
            d={glowPath}
            stroke={color}
            strokeWidth={glowStrokeWidth}
            strokeOpacity={glowOpacity}
            strokeLinecap="round"
            fill="none"
          />
          {/* main foreground arc */}
          <AnimatedPath
            d={fgPath}
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
      {/* content in the centre */}
      <View
        style={{
          position: 'absolute',
          width: size - thickness * 2,
          height: size - thickness * 2,
          left: thickness,
          top: thickness,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
};
