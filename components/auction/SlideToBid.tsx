import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";

type SlideToBidProps = {
  amount: number;
  onComplete: (amount: number) => void;
  disabled?: boolean;
  width?: number | `${number}%`;
};

const THUMB_SIZE = 38;
const TRACK_PADDING = 4;

function SlideToBidComponent({
  amount,
  onComplete,
  disabled = false,
  width = "74%",
}: SlideToBidProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const isSubmittingRef = useRef(false);
  const dragStartRef = useRef(0);
  const currentXRef = useRef(0);

  const maxTranslate = Math.max(
    0,
    trackWidth - THUMB_SIZE - TRACK_PADDING * 2,
  );

  useEffect(() => {
    const id = translateX.addListener(({ value }) => {
      currentXRef.current = value;
    });
    return () => {
      translateX.removeListener(id);
    };
  }, [translateX]);

  const resetThumb = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [translateX]);

  const completeSlide = useCallback(() => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    Animated.timing(translateX, {
      toValue: maxTranslate,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      onComplete(amount);
      setTimeout(() => {
        resetThumb();
        isSubmittingRef.current = false;
      }, 260);
    });
  }, [amount, maxTranslate, onComplete, resetThumb, translateX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () =>
          !disabled && !isSubmittingRef.current,
        onStartShouldSetPanResponder: () =>
          !disabled && !isSubmittingRef.current,
        onMoveShouldSetPanResponderCapture: (_, g) =>
          !disabled &&
          !isSubmittingRef.current &&
          Math.abs(g.dx) > Math.abs(g.dy) &&
          Math.abs(g.dx) > 1,
        onMoveShouldSetPanResponder: (_, g) =>
          !disabled &&
          !isSubmittingRef.current &&
          Math.abs(g.dx) > Math.abs(g.dy) &&
          Math.abs(g.dx) > 1,
        onPanResponderGrant: () => {
          dragStartRef.current = currentXRef.current;
        },
        onPanResponderMove: (_, g) => {
          const next = Math.min(
            Math.max(dragStartRef.current + g.dx, 0),
            maxTranslate,
          );
          translateX.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const traveled = Math.min(
            Math.max(dragStartRef.current + g.dx, 0),
            maxTranslate,
          );
          const shouldComplete =
            traveled >= maxTranslate * 0.9 || (g.vx > 0.9 && g.dx > 24);
          if (shouldComplete) {
            completeSlide();
            return;
          }
          resetThumb();
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: resetThumb,
      }),
    [completeSlide, disabled, maxTranslate, resetThumb, translateX],
  );

  return (
    <View
      style={[styles.track, { width }, disabled ? styles.trackDisabled : null]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <Text style={[styles.label, disabled ? styles.labelDisabled : null]}>
        {disabled ? "Connecting…" : `Slide to bid $${amount}`}
      </Text>

      <Animated.View
        style={[styles.thumbWrap, { transform: [{ translateX }] }]}
      >
        <View style={[styles.thumb, disabled ? styles.thumbDisabled : null]}>
          <Text style={styles.thumbArrow}>➜</Text>
        </View>
      </Animated.View>
    </View>
  );
}

export const SlideToBid = memo(SlideToBidComponent);

const styles = StyleSheet.create({
  track: {
    height: 46,
    borderRadius: 14,
    alignSelf: "center",
    marginBottom: 12,
    backgroundColor: "rgba(124,92,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(124,92,255,0.75)",
    justifyContent: "center",
    overflow: "hidden",
  },
  trackDisabled: {
    opacity: 0.65,
  },
  label: {
    color: "#EEE8FF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  labelDisabled: {
    color: "rgba(238,232,255,0.72)",
  },
  thumbWrap: {
    position: "absolute",
    left: TRACK_PADDING,
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#7C5CFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#7C5CFF",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  thumbDisabled: {
    backgroundColor: "rgba(124,92,255,0.5)",
  },
  thumbArrow: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 2,
  },
});
