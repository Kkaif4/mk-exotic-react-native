import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { VendorDetailScreen } from './src/screens/VendorDetailScreen';
import { WarningModalContainer } from './src/components/common/WarningModal';
import { SplashScreen } from './src/components/common/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'vendorDetail'>('home');
  const [selectedVendor, setSelectedVendor] = useState<{ id: string; name: string } | null>(null);

  const handleNavigateToVendor = (vendorId: string, vendorName: string) => {
    setSelectedVendor({ id: vendorId, name: vendorName });
    setCurrentScreen('vendorDetail');
  };

  const handleBackToHome = () => {
    setSelectedVendor(null);
    setCurrentScreen('home');
  };

  return (
    <>
      <StatusBar style="light" />
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} durationMs={3000} />
      ) : (
        <>
          {currentScreen === 'home' || !selectedVendor ? (
            <HomeScreen onNavigateToVendor={handleNavigateToVendor} />
          ) : (
            <VendorDetailScreen
              vendorId={selectedVendor.id}
              vendorName={selectedVendor.name}
              onBack={handleBackToHome}
            />
          )}
          <WarningModalContainer />
        </>
      )}
    </>
  );
}
