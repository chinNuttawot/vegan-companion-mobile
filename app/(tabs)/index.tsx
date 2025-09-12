// app/(tabs)/index.tsx
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const TARGET_URL = "https://vegancompanion.passio.eco/";

export default function HomeScreen() {
  const webRef = useRef<WebView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  const reload = useCallback(() => {
    setErrorInfo(null);
    setLoading(true);
    setRetryTick((n) => n + 1);
    setTimeout(() => webRef.current?.reload(), 100);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    reload();
    setTimeout(() => setRefreshing(false), 700);
  }, [reload]);

  const onShouldStart = useCallback((event: any) => {
    const url: string = event.url || "";
    if (
      url.startsWith("tel:") ||
      url.startsWith("mailto:") ||
      url.startsWith("sms:") ||
      url.startsWith("intent:")
    ) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <WebView
        key={retryTick}
        ref={webRef}
        source={{ uri: TARGET_URL }}
        originWhitelist={["*"]}
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={onShouldStart}
        onLoadStart={() => {
          setLoading(true);
          setErrorInfo(null);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => {
          const { code, description, url } = e.nativeEvent || {};
          setErrorInfo(
            `Load error: ${description ?? "unknown"} (code ${code})\nURL: ${
              url ?? TARGET_URL
            }`
          );
        }}
        onHttpError={(e) => {
          const { statusCode, description, url } = e.nativeEvent || {};
          setErrorInfo(
            `HTTP error: ${statusCode} ${description ?? ""}\nURL: ${
              url ?? TARGET_URL
            }`
          );
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" />
          </View>
        )}
        pullToRefreshEnabled={Platform.OS === "android"}
        {...(Platform.OS === "ios"
          ? {
              refreshControl: (
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              ),
            }
          : {})}
        allowsBackForwardNavigationGestures={false}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        incognito={false}
      />

      {(loading || errorInfo) && (
        <View style={styles.overlay}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>โหลดหน้าไม่สำเร็จ</Text>
              <Text style={styles.errorMsg}>{errorInfo}</Text>
              <TouchableOpacity onPress={reload} style={styles.retryBtn}>
                <Text style={styles.retryText}>ลองใหม่</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { height: "100%", backgroundColor: "#fff" },
  webContainer: { flex: 1 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  errorBox: { maxWidth: 520, gap: 10, alignItems: "center" },
  errorTitle: { fontSize: 16, fontWeight: "600" },
  errorMsg: { fontSize: 12, textAlign: "center", opacity: 0.9 },
  retryBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  retryText: { fontSize: 14, fontWeight: "600" },
});
