import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type SlideOverlayProps = {
  children: React.ReactNode;
  peekHeight?: number;
};

export function SlideOverlay({ children, peekHeight = 56 }: SlideOverlayProps) {
  const [panelHeight, setPanelHeight] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  const collapsedOffset = useMemo(
    () => Math.max(0, panelHeight - peekHeight),
    [panelHeight, peekHeight],
  );

  const animateTo = useCallback(
    (nextCollapsed: boolean) => {
      const toValue = nextCollapsed ? collapsedOffset : 0;
      setCollapsed(nextCollapsed);
      Animated.spring(translateY, {
        toValue,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
        mass: 0.8,
      }).start();
    },
    [collapsedOffset, translateY],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dy) > Math.abs(g.dx) && Math.abs(g.dy) > 5,
        onPanResponderMove: (_, g) => {
          const base = collapsed ? collapsedOffset : 0;
          const next = Math.min(Math.max(base + g.dy, 0), collapsedOffset);
          translateY.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const base = collapsed ? collapsedOffset : 0;
          const current = Math.min(
            Math.max(base + g.dy, 0),
            collapsedOffset,
          );
          const shouldCollapse =
            g.vy > 0.25 || current > collapsedOffset * 0.45;
          animateTo(shouldCollapse);
        },
      }),
    [animateTo, collapsed, collapsedOffset, translateY],
  );

  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateY }] }]}
      onLayout={(e) => {
        const nextHeight = e.nativeEvent.layout.height;
        if (!nextHeight || nextHeight === panelHeight) return;
        setPanelHeight(nextHeight);
      }}
    >
      <View style={styles.handleRow} {...panResponder.panHandlers}>
        <Pressable
          onPress={() => animateTo(!collapsed)}
          hitSlop={10}
          style={styles.handlePressable}
        >
          <View style={styles.handle} />
          <Text style={styles.handleText}>{collapsed ? "Show info" : "Hide info"}</Text>
        </Pressable>
      </View>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 12,
  },
  handleRow: {
    alignItems: "center",
    marginBottom: 8,
  },
  handlePressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  handle: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  handleText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "700",
  },
});
