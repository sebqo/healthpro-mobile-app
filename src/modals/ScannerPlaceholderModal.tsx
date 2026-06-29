import { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult, BarcodeType } from 'expo-camera';
import { ActivityIndicator, Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/styles';
import { accent } from '../constants/colors';
import type { Theme } from '../types';

type ProductLookupState = 'idle' | 'loading' | 'found' | 'not-found' | 'error';
type ScannerStatus = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  tone: 'loading' | 'success' | 'failed';
};

export type ScannedProduct = {
  name: string;
  barcode: string;
  brand?: string;
  imageUrl?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

type OpenFoodFactsResponse = {
  status?: number;
  product?: {
    product_name?: string;
    brands?: string;
    image_front_small_url?: string;
    nutriments?: {
      'energy-kcal_100g'?: number;
      'energy-kcal'?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
    };
  };
};

const barcodeTypes: BarcodeType[] = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'];
const failedColor = '#ff6b6b';

const formatNutrient = (value?: number, unit = 'g') => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  return `${Math.round(value * 10) / 10}${unit}`;
};

const getProductLookupUrl = (barcode: string) =>
  `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode,
  )}?fields=product_name,brands,nutriments,image_front_small_url`;

export function ScannerPlaceholderModal({
  activeTheme,
  visible,
  onClose,
  onUseProduct,
}: {
  activeTheme: Theme;
  visible: boolean;
  onClose: () => void;
  onUseProduct?: (product: ScannedProduct) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [lookupState, setLookupState] = useState<ProductLookupState>('idle');
  const [product, setProduct] = useState<ScannedProduct | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const scannerActive = visible && permission?.granted && lookupState === 'idle';
  const cameraVisible = permission?.granted && lookupState === 'idle';

  useEffect(() => {
    if (!visible) {
      setScannedBarcode('');
      setLookupState('idle');
      setProduct(null);
      setErrorMessage('');
    }
  }, [visible]);

  const lookupProduct = async (barcode: string) => {
    setLookupState('loading');
    setProduct(null);
    setErrorMessage('');

    try {
      const response = await fetch(getProductLookupUrl(barcode));

      if (!response.ok) {
        throw new Error(`Lookup failed with status ${response.status}`);
      }

      const data = (await response.json()) as OpenFoodFactsResponse;
      const foundProduct = data.product;

      if (data.status !== 1 || !foundProduct) {
        setLookupState('not-found');
        return;
      }

      const nutriments = foundProduct.nutriments ?? {};

      setProduct({
        name: foundProduct.product_name?.trim() || 'Unnamed product',
        barcode,
        brand: foundProduct.brands?.trim(),
        imageUrl: foundProduct.image_front_small_url,
        calories: nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'],
        protein: nutriments.proteins_100g,
        carbs: nutriments.carbohydrates_100g,
        fat: nutriments.fat_100g,
      });
      setLookupState('found');
    } catch {
      setErrorMessage('Could not look up this product. Check your connection and try again.');
      setLookupState('error');
    }
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!scannerActive || !result.data) {
      return;
    }

    setScannedBarcode(result.data);
    lookupProduct(result.data);
  };

  const scanAgain = () => {
    setScannedBarcode('');
    setLookupState('idle');
    setProduct(null);
    setErrorMessage('');
  };

  const renderPermissionContent = () => (
    <>
      <View style={[styles.scannerPlaceholderIcon, { backgroundColor: activeTheme.modalValueBg }]}>
        <Ionicons name="camera-outline" size={34} color={accent} />
      </View>
      <Text style={[styles.scannerPlaceholderTitle, { color: activeTheme.titleText }]}>Camera access</Text>
      <Text style={[styles.scannerPlaceholderText, { color: activeTheme.secondaryText }]}>
        Allow camera access to scan food barcodes.
      </Text>
      <TouchableOpacity activeOpacity={0.82} onPress={requestPermission} style={styles.scannerPlaceholderDone}>
        <Text style={styles.scannerPlaceholderDoneText}>Allow camera</Text>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.78} onPress={onClose} style={styles.scannerSecondaryButton}>
        <Text style={[styles.scannerSecondaryButtonText, { color: activeTheme.secondaryText }]}>Close</Text>
      </TouchableOpacity>
    </>
  );

  const renderNutritionRow = (label: string, value: string) => (
    <View style={[styles.scannerNutritionCell, { backgroundColor: activeTheme.modalValueBg }]}>
      <Text style={[styles.scannerNutritionValue, { color: activeTheme.titleText }]}>{value}</Text>
      <Text style={[styles.scannerNutritionLabel, { color: activeTheme.secondaryText }]}>{label}</Text>
    </View>
  );

  const getStatusContent = (): ScannerStatus => {
    if (lookupState === 'loading') {
      return {
        icon: 'search',
        title: 'Looking up product...',
        message: 'Checking Open Food Facts for this barcode.',
        tone: 'loading',
      };
    }

    if (lookupState === 'found') {
      return {
        icon: 'checkmark',
        title: 'Scan successful',
        message: scannedBarcode ? `Barcode: ${scannedBarcode}` : 'Product details are ready.',
        tone: 'success',
      };
    }

    return {
      icon: 'close',
      title: 'Scan failed',
      message:
        lookupState === 'not-found'
          ? 'This barcode is not in Open Food Facts yet.'
          : errorMessage || 'Could not look up this product. Try scanning again.',
      tone: 'failed',
    };
  };

  const renderStatusPanel = () => {
    const status = getStatusContent();
    const iconColor = status.tone === 'failed' ? failedColor : accent;

    return (
      <View
        style={[
          styles.scannerStatusPanel,
          {
            backgroundColor: activeTheme.modalValueBg,
            borderColor: activeTheme.cardBorder,
          },
        ]}
      >
        <View
          style={[
            styles.scannerStatusIcon,
            {
              backgroundColor:
                status.tone === 'failed'
                  ? 'rgba(255,107,107,0.13)'
                  : activeTheme.mode === 'dark'
                    ? 'rgba(184,239,47,0.13)'
                    : 'rgba(184,239,47,0.2)',
            },
          ]}
        >
          {status.tone === 'loading' ? (
            <ActivityIndicator color={accent} />
          ) : (
            <Ionicons name={status.icon} size={25} color={iconColor} />
          )}
        </View>
        <Text style={[styles.scannerStatusTitle, { color: activeTheme.titleText }]}>{status.title}</Text>
        <Text style={[styles.scannerStatusMessage, { color: activeTheme.secondaryText }]}>{status.message}</Text>
      </View>
    );
  };

  const renderResult = () => {
    if (lookupState === 'loading') {
      return null;
    }

    if (lookupState === 'not-found') {
      return null;
    }

    if (lookupState === 'error') {
      return null;
    }

    if (lookupState === 'found' && product) {
      return (
        <View style={[styles.scannerResultCard, { backgroundColor: activeTheme.modalValueBg }]}>
          <View style={styles.scannerProductHeader}>
            {product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={styles.scannerProductImage} /> : null}
            <View style={styles.scannerProductText}>
              <Text style={[styles.scannerProductName, { color: activeTheme.titleText }]} numberOfLines={2}>
                {product.name}
              </Text>
              {product.brand ? (
                <Text style={[styles.scannerProductBrand, { color: activeTheme.secondaryText }]} numberOfLines={1}>
                  {product.brand}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.scannerNutritionGrid}>
            {renderNutritionRow('kcal', formatNutrient(product.calories, ''))}
            {renderNutritionRow('protein', formatNutrient(product.protein))}
            {renderNutritionRow('carbs', formatNutrient(product.carbs))}
            {renderNutritionRow('fat', formatNutrient(product.fat))}
          </View>
        </View>
      );
    }

    return (
      <Text style={[styles.scannerPlaceholderText, { color: activeTheme.secondaryText }]}>
        Align a barcode inside the frame.
      </Text>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: activeTheme.modalOverlay }]}>
        <View
          style={[
            styles.scannerPlaceholderCard,
            {
              backgroundColor: activeTheme.modalBg,
              borderColor: activeTheme.cardBorder,
              shadowColor: activeTheme.shadowColor,
            },
          ]}
        >
          {!permission?.granted ? (
            renderPermissionContent()
          ) : (
            <>
              {cameraVisible ? (
                <View style={styles.scannerCameraFrame}>
                  <CameraView
                    active={scannerActive}
                    facing="back"
                    style={styles.scannerCamera}
                    barcodeScannerSettings={{ barcodeTypes }}
                    onBarcodeScanned={scannerActive ? handleBarcodeScanned : undefined}
                  />
                  <View style={styles.scannerGuideFrame} pointerEvents="none" />
                </View>
              ) : (
                renderStatusPanel()
              )}
              <Text style={[styles.scannerBarcodeText, { color: activeTheme.secondaryText }]} numberOfLines={1}>
                {scannedBarcode ? `Barcode: ${scannedBarcode}` : 'Ready to scan'}
              </Text>
              {renderResult()}
              {lookupState === 'found' && product && onUseProduct ? (
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => onUseProduct(product)}
                  style={[styles.scannerPrimaryButton, styles.scannerUseProductButton]}
                >
                  <Text style={styles.scannerPlaceholderDoneText}>Use this product</Text>
                </TouchableOpacity>
              ) : null}
              <View style={styles.scannerActionRow}>
                <TouchableOpacity activeOpacity={0.82} onPress={scanAgain} style={styles.scannerPrimaryButton}>
                  <Text style={styles.scannerPlaceholderDoneText}>Scan again</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.78} onPress={onClose} style={styles.scannerSecondaryButton}>
                  <Text style={[styles.scannerSecondaryButtonText, { color: activeTheme.secondaryText }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
