import {
    inventoryResultOptions,
    type InventoryResult,
} from "../../../data/mockData";
import { graphqlRequest } from "../../../lib/graphql";
import { useAppDispatch } from "../../../store/hooks";
import { addInventoryRecord } from "../../../store/inventorySlice";

import {
    BarcodeScanningResult,
    CameraView,
    useCameraPermissions,
} from "expo-camera";

import {
    router,
    useLocalSearchParams,
} from "expo-router";

import { useState } from "react";

import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type LibraryItem = {
  id: string;
  barcode: string;
  title: string;
  callNumber: string;
  expectedLocation: string;
  currentStatus: string;
  assignmentId: string;
};

const LIBRARY_ITEM_QUERY = `
  query GetLibraryItem($barcode: String!) {
    libraryItem(barcode: $barcode) {
      id
      barcode
      title
      callNumber
      expectedLocation
      currentStatus
      assignmentId
    }
  }
`;

export default function ScannerScreen() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const dispatch = useAppDispatch();

  const [permission, requestPermission] =
    useCameraPermissions();

  const [scanned, setScanned] =
    useState(false);

  const [barcode, setBarcode] =
    useState("");

  const [manualBarcode, setManualBarcode] =
    useState("");

  const [item, setItem] =
    useState<LibraryItem | null>(null);

  const [isLookingUp, setIsLookingUp] =
    useState(false);

  const [lookupError, setLookupError] =
    useState<string | null>(null);

  const [selectedResult, setSelectedResult] =
    useState<InventoryResult | null>(null);

  const [saved, setSaved] =
    useState(false);

  function handleBarcodeScanned(
    result: BarcodeScanningResult
  ) {
    if (scanned || isLookingUp) {
      return;
    }

    void loadBarcode(result.data);
  }

  async function loadBarcode(
    value: string
  ) {
    const cleanedBarcode = value.trim();

    if (!cleanedBarcode) {
      return;
    }

    setBarcode(cleanedBarcode);
    setScanned(true);
    setItem(null);
    setSelectedResult(null);
    setSaved(false);
    setLookupError(null);
    setIsLookingUp(true);

    try {
      const data = await graphqlRequest<
        {
          libraryItem: LibraryItem | null;
        },
        {
          barcode: string;
        }
      >(
        LIBRARY_ITEM_QUERY,
        {
          barcode: cleanedBarcode,
        }
      );

      setItem(data.libraryItem);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setLookupError(error.message);
      } else {
        setLookupError(
          "The item lookup could not be completed."
        );
      }
    } finally {
      setIsLookingUp(false);
    }
  }

  function handleManualSubmit() {
    if (isLookingUp) {
      return;
    }

    void loadBarcode(manualBarcode);
  }

  function saveInventoryResult() {
    if (!selectedResult || !barcode) {
      return;
    }

    dispatch(
      addInventoryRecord({
        assignmentId: id,
        barcode,
        result: selectedResult,
      })
    );

    setSaved(true);
  }

  function scanAnotherItem() {
    setBarcode("");
    setManualBarcode("");
    setItem(null);
    setScanned(false);
    setIsLookingUp(false);
    setLookupError(null);
    setSelectedResult(null);
    setSaved(false);
  }

  function retryLookup() {
    if (!barcode || isLookingUp) {
      return;
    }

    void loadBarcode(barcode);
  }

  if (!permission) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.message}>
          Checking camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.permissionTitle}>
          Camera access required
        </Text>

        <Text style={styles.permissionMessage}>
          ShelfSync uses the camera to scan
          library item barcodes.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>
            Allow camera access
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>
            Return to assignment
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ‹ Assignment
          </Text>
        </Pressable>

        <Text style={styles.title}>
          Scan item
        </Text>

        <Text style={styles.subtitle}>
          Assignment {id}
        </Text>
      </View>

      {!scanned ? (
        <>
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={
                handleBarcodeScanned
              }
              barcodeScannerSettings={{
                barcodeTypes: [
                  "code128",
                  "code39",
                  "ean13",
                  "ean8",
                  "upc_a",
                  "upc_e",
                ],
              }}
            />

            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame} />
            </View>
          </View>

          <Text style={styles.instructions}>
            Position the item barcode inside
            the frame.
          </Text>

          <View style={styles.manualCard}>
            <Text style={styles.manualTitle}>
              Enter barcode manually
            </Text>

            <TextInput
              style={styles.input}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder="Enter item barcode"
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={
                handleManualSubmit
              }
            />

            <Pressable
              style={[
                styles.manualButton,
                !manualBarcode.trim() &&
                  styles.disabledButton,
              ]}
              disabled={
                !manualBarcode.trim()
              }
              onPress={handleManualSubmit}
            >
              <Text style={styles.manualButtonText}>
                Look up item
              </Text>
            </Pressable>

            <Text style={styles.testText}>
              Test barcode: 100000000001
            </Text>
          </View>
        </>
      ) : isLookingUp ? (
        <View style={styles.resultCard}>
          <ActivityIndicator
            size="large"
            color="#17324d"
          />

          <Text style={styles.lookupTitle}>
            Looking up item
          </Text>

          <Text style={styles.savedBarcode}>
            {barcode}
          </Text>

          <Text style={styles.lookupMessage}>
            Searching the ShelfSync database...
          </Text>
        </View>
      ) : lookupError ? (
        <View style={styles.resultCard}>
          <Text style={styles.notFoundTitle}>
            Lookup failed
          </Text>

          <Text style={styles.savedBarcode}>
            {barcode}
          </Text>

          <Text style={styles.notFoundMessage}>
            {lookupError}
          </Text>

          <Text style={styles.errorHint}>
            Confirm the backend is running and
            the phone is connected to the same
            network as the computer.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={retryLookup}
          >
            <Text style={styles.primaryButtonText}>
              Try again
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={scanAnotherItem}
          >
            <Text style={styles.secondaryButtonText}>
              Scan another item
            </Text>
          </Pressable>
        </View>
      ) : saved ? (
        <View style={styles.resultCard}>
          <Text style={styles.successTitle}>
            Inventory result saved
          </Text>

          <Text style={styles.savedBarcode}>
            {barcode}
          </Text>

          <Text style={styles.savedResult}>
            Result: {selectedResult}
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={scanAnotherItem}
          >
            <Text style={styles.primaryButtonText}>
              Scan next item
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>
              Finish scanning
            </Text>
          </Pressable>
        </View>
      ) : item ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>
            Item found
          </Text>

          <Text style={styles.itemTitle}>
            {item.title}
          </Text>

          {item.assignmentId !== id && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>
                Different assignment
              </Text>

              <Text style={styles.warningMessage}>
                This item belongs to assignment{" "}
                {item.assignmentId}, not
                assignment {id}.
              </Text>
            </View>
          )}

          <View style={styles.itemDetails}>
            <Text style={styles.detailLabel}>
              Barcode
            </Text>

            <Text style={styles.detailValue}>
              {item.barcode}
            </Text>

            <Text style={styles.detailLabel}>
              Call number
            </Text>

            <Text style={styles.detailValue}>
              {item.callNumber}
            </Text>

            <Text style={styles.detailLabel}>
              Expected location
            </Text>

            <Text style={styles.detailValue}>
              {item.expectedLocation}
            </Text>

            <Text style={styles.detailLabel}>
              Current status
            </Text>

            <Text style={styles.detailValue}>
              {item.currentStatus}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            Record inventory result
          </Text>

          <View style={styles.resultOptions}>
            {inventoryResultOptions.map(
              (result) => (
                <Pressable
                  key={result}
                  style={[
                    styles.resultOption,
                    selectedResult === result &&
                      styles.selectedResultOption,
                  ]}
                  onPress={() =>
                    setSelectedResult(result)
                  }
                >
                  <Text
                    style={[
                      styles.resultOptionText,
                      selectedResult === result &&
                        styles.selectedResultOptionText,
                    ]}
                  >
                    {result}
                  </Text>
                </Pressable>
              )
            )}
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              !selectedResult &&
                styles.disabledButton,
            ]}
            disabled={!selectedResult}
            onPress={saveInventoryResult}
          >
            <Text style={styles.primaryButtonText}>
              Save result
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={scanAnotherItem}
          >
            <Text style={styles.secondaryButtonText}>
              Cancel and scan again
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.resultCard}>
          <Text style={styles.notFoundTitle}>
            Item not found
          </Text>

          <Text style={styles.savedBarcode}>
            {barcode}
          </Text>

          <Text style={styles.notFoundMessage}>
            No library item with this barcode
            was found in the ShelfSync database.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={scanAnotherItem}
          >
            <Text style={styles.primaryButtonText}>
              Scan another item
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  content: {
    paddingBottom: 40,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#f4f6f8",
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backText: {
    marginBottom: 20,
    fontSize: 16,
    fontWeight: "600",
    color: "#17324d",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#17324d",
  },
  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#657482",
  },
  cameraContainer: {
    height: 300,
    marginHorizontal: 24,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: "82%",
    height: 115,
    borderWidth: 3,
    borderColor: "#ffffff",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  instructions: {
    marginTop: 16,
    paddingHorizontal: 24,
    textAlign: "center",
    fontSize: 15,
    color: "#53616e",
  },
  manualCard: {
    margin: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  manualTitle: {
    marginBottom: 14,
    fontSize: 17,
    fontWeight: "700",
    color: "#17212b",
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#cbd3da",
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  manualButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: "#17324d",
  },
  manualButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  testText: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 13,
    color: "#657482",
  },
  resultCard: {
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  lookupTitle: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 23,
    fontWeight: "800",
    color: "#17324d",
  },
  lookupMessage: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 15,
    color: "#657482",
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#287a4d",
  },
  itemTitle: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: "800",
    color: "#17324d",
  },
  itemDetails: {
    marginTop: 24,
  },
  detailLabel: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: "700",
    color: "#657482",
  },
  detailValue: {
    marginTop: 4,
    fontSize: 16,
    color: "#17212b",
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 14,
    fontSize: 18,
    fontWeight: "700",
    color: "#17212b",
  },
  resultOptions: {
    gap: 10,
    marginBottom: 22,
  },
  resultOption: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbd3da",
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },
  selectedResultOption: {
    borderColor: "#17324d",
    backgroundColor: "#17324d",
  },
  resultOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#344454",
  },
  selectedResultOptionText: {
    color: "#ffffff",
  },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#17324d",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  secondaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#17324d",
  },
  disabledButton: {
    backgroundColor: "#9aa6b1",
  },
  successTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#287a4d",
  },
  savedBarcode: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#17324d",
  },
  savedResult: {
    marginTop: 10,
    marginBottom: 24,
    fontSize: 16,
    color: "#53616e",
  },
  notFoundTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#17324d",
  },
  notFoundMessage: {
    marginTop: 16,
    marginBottom: 12,
    fontSize: 15,
    lineHeight: 23,
    color: "#53616e",
  },
  errorHint: {
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 21,
    color: "#7c8994",
  },
  warningCard: {
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#fff1cf",
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#8a6112",
  },
  warningMessage: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: "#6f5318",
  },
  permissionTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#17324d",
  },
  permissionMessage: {
    marginTop: 12,
    marginBottom: 28,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    color: "#53616e",
  },
  message: {
    fontSize: 16,
    color: "#53616e",
  },
});