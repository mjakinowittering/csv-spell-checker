import type { RankedLanguage } from './detect';

// Chrome's built-in Language Detector API (Chrome 138+). TypeScript's DOM
// types do not include it yet, so only the parts used here are declared.

type Availability =
    'unavailable' | 'downloadable' | 'downloading' | 'available';

type Detection = { detectedLanguage: string; confidence: number };

export interface BuiltInDetector {
    detect(input: string): Promise<Detection[]>;
    destroy?(): void;
}

export interface BuiltInDetectorFactory {
    availability(): Promise<Availability>;
    create(): Promise<BuiltInDetector>;
}

/** Downloading the model can be slow; after this, Franc takes over. */
const TIMEOUT_MS = 5000;

function isFactory(value: unknown): value is BuiltInDetectorFactory {
    return (
        (typeof value === 'function' || typeof value === 'object') &&
        value !== null &&
        'availability' in value &&
        'create' in value
    );
}

/** The browser's detector, when `'LanguageDetector' in self`. */
export function builtInDetector(): BuiltInDetectorFactory | null {
    if (typeof self === 'undefined' || !('LanguageDetector' in self)) {
        return null;
    }
    const candidate: unknown = Reflect.get(self, 'LanguageDetector');
    return isFactory(candidate) ? candidate : null;
}

/**
 * `create()` rejects with these when the device has no model (even though
 * `availability()` did not say `unavailable`) or when downloading one needs a
 * user gesture that has expired. Both simply mean "use Franc".
 */
function isExpectedUnavailability(error: unknown): boolean {
    return (
        error instanceof DOMException &&
        (error.name === 'NotSupportedError' || error.name === 'NotAllowedError')
    );
}

function withTimeout<T>(pending: Promise<T>, milliseconds: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error('Language detection timed out')),
            milliseconds
        );
        pending.then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            (error: unknown) => {
                clearTimeout(timer);
                reject(error);
            }
        );
    });
}

/**
 * Ranked languages with the detector's own confidence scores, most likely
 * first. Null when the browser has no usable model.
 */
export async function detectWithBuiltIn(
    text: string,
    factory: BuiltInDetectorFactory,
    timeout: number = TIMEOUT_MS
): Promise<RankedLanguage[] | null> {
    const availability = await withTimeout(factory.availability(), timeout);
    if (availability === 'unavailable') return null;

    let detector: BuiltInDetector;
    try {
        detector = await withTimeout(factory.create(), timeout);
    } catch (error) {
        if (isExpectedUnavailability(error)) return null;
        throw error;
    }
    try {
        const detections = await withTimeout(detector.detect(text), timeout);
        return detections
            .filter((detection) => detection.detectedLanguage !== 'und')
            .map((detection) => ({
                language: detection.detectedLanguage,
                confidence: detection.confidence
            }));
    } finally {
        detector.destroy?.();
    }
}
