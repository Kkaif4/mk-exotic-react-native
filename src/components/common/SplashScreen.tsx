import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Platform,
  Easing,
} from "react-native";
import { colors } from "../../core/theme";

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

const BAR_WIDTH = 240;

export const SplashScreen = React.memo(function SplashScreen({
  onFinish,
  durationMs = 3000,
}: SplashScreenProps) {
  // Exit fade driver
  const exitAnim = useRef(new Animated.Value(1)).current;
  const nativeProgressAnim = useRef(new Animated.Value(0)).current;
  const nativeScaleAnim = useRef(new Animated.Value(0.92)).current;
  const nativeFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // For Native platforms (iOS/Android): run hardware native driver
    if (Platform.OS !== "web") {
      Animated.parallel([
        Animated.timing(nativeFadeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(nativeScaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(nativeProgressAnim, {
          toValue: 1,
          duration: Math.max(durationMs - 300, 1000),
          easing: Easing.bezier(0.25, 1, 0.5, 1),
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Exit transition at durationMs: smooth fade out to 0 opacity
    const timer = setTimeout(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, durationMs);

    return () => clearTimeout(timer);
  }, [
    durationMs,
    onFinish,
    exitAnim,
    nativeFadeAnim,
    nativeScaleAnim,
    nativeProgressAnim,
  ]);

  const nativeTranslateX = nativeProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAR_WIDTH, 0],
  });

  return (
    <Animated.View style={[styles.container, { opacity: exitAnim }]}>
      {/* On Web: inject pure GPU Compositor keyframes for butter-smooth 60/120fps animation */}
      {Platform.OS === "web" && (
        <style>{`
          @keyframes mkGlowPulse {
            0%, 100% { transform: scale(1); opacity: 0.22; }
            50% { transform: scale(1.08); opacity: 0.55; }
          }
          @keyframes mkLogoEntrance {
            0% { opacity: 0; transform: scale(0.9) translateY(8px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes mkProgressFill {
            0% { transform: scaleX(0); }
            100% { transform: scaleX(1); }
          }
          @keyframes mkMsg1 {
            0% { opacity: 0; transform: translateY(4px); }
            10%, 30% { opacity: 1; transform: translateY(0); }
            38% { opacity: 0; transform: translateY(-4px); }
            100% { opacity: 0; }
          }
          @keyframes mkMsg2 {
            0%, 38% { opacity: 0; transform: translateY(4px); }
            45%, 68% { opacity: 1; transform: translateY(0); }
            74% { opacity: 0; transform: translateY(-4px); }
            100% { opacity: 0; }
          }
          @keyframes mkMsg3 {
            0%, 74% { opacity: 0; transform: translateY(4px); }
            80%, 100% { opacity: 1; transform: translateY(0); }
          }
          .mk-logo-box {
            animation: mkLogoEntrance 650ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
            will-change: transform, opacity;
          }
          .mk-glow-ring {
            animation: mkGlowPulse 2200ms ease-in-out infinite;
            will-change: transform, opacity;
          }
          .mk-progress-bar-fill {
            width: 100%;
            height: 100%;
            background-color: ${colors.buttonHover};
            border-radius: 2px;
            transform-origin: 0% 50%;
            animation: mkProgressFill ${durationMs - 250}ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
            will-change: transform;
          }
          .mk-msg-item {
            position: absolute;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 11px;
            font-family: monospace;
            color: ${colors.textMuted};
            letter-spacing: 0.2px;
            pointer-events: none;
          }
          .mk-msg-1 { animation: mkMsg1 ${durationMs}ms ease forwards; }
          .mk-msg-2 { animation: mkMsg2 ${durationMs}ms ease forwards; }
          .mk-msg-3 { animation: mkMsg3 ${durationMs}ms ease forwards; }
        `}</style>
      )}

      <View style={styles.centerStage}>
        {/* Glowing Backdrop Ring */}
        <View
          // @ts-ignore
          className="mk-glow-ring"
          style={styles.glowRing}
        />

        {/* Logo Container */}
        <View
          // @ts-ignore
          className="mk-logo-box"
          style={styles.logoContainer}
        >
          <Image
            source={require("../../../assets/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* App Title & Tagline */}
        <View style={styles.textContainer}>
          <Text style={styles.appTitle}>MK EXOTIC FRUITS</Text>
          <Text style={styles.appSubtitle}>
            100% Offline Billing & Cumulative Lifetime Ledgers
          </Text>
        </View>

        {/* 60fps / 120fps Hardware Progress Bar */}
        <View style={styles.loadingSection}>
          <View style={styles.progressBarTrack}>
            {Platform.OS === "web" ? (
              // @ts-ignore
              <div className="mk-progress-bar-fill" />
            ) : (
              <Animated.View
                style={[
                  styles.progressBarFillNative,
                  {
                    transform: [{ translateX: nativeTranslateX }],
                  },
                ]}
              />
            )}
          </View>

          {/* Smooth Dynamic Status Messages */}
          <View style={styles.statusBox}>
            {Platform.OS === "web" ? (
              <>
                {/* @ts-ignore */}
                <div className="mk-msg-item mk-msg-1">
                  Initializing Offline Ledger...
                </div>
                {/* @ts-ignore */}
                <div className="mk-msg-item mk-msg-2">
                  Verifying Financial Invariants...
                </div>
                {/* @ts-ignore */}
                <div className="mk-msg-item mk-msg-3">
                  Welcome to MK Exotic Fruits
                </div>
              </>
            ) : (
              <Text style={styles.statusTextNative}>
                Loading MK Exotic Fruits...
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Footer Branding */}
      <View style={styles.footer}>
        <Text style={styles.footerVersion}>
          v2.0.0 · Offline First Accounting
        </Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.appBackground,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
  },
  centerStage: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    top: -15,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(37, 138, 86, 0.22)",
    shadowColor: colors.brandHighlight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
  },
  logoContainer: {
    width: 125,
    height: 125,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 18,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.textPrimary,
    letterSpacing: 2,
    fontFamily: "monospace",
    textAlign: "center",
  },
  appSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 5,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  loadingSection: {
    width: BAR_WIDTH,
    alignItems: "center",
  },
  progressBarTrack: {
    width: BAR_WIDTH,
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFillNative: {
    width: BAR_WIDTH,
    height: "100%",
    backgroundColor: colors.buttonHover,
    borderRadius: 2,
  },
  statusBox: {
    width: BAR_WIDTH,
    height: 18,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  statusTextNative: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "monospace",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 28,
    alignItems: "center",
  },
  footerVersion: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
});
