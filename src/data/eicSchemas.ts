import { z } from 'zod';

/**
 * Quality Flag Schema:
 * Preserves the empirical integrity of each NASA observation.
 * VALID: Instrument measurement calibrated and verified.
 * ESTIMATED: Temporally interpolated or proxy-derived observation.
 * SENSOR_GAP: Sensor disruption, satellite orbit hiatus, or missing telemetry.
 * MISSING: No empirical value available.
 */
export const QualityFlagSchema = z.enum(['VALID', 'ESTIMATED', 'SENSOR_GAP', 'MISSING']);
export type QualityFlag = z.infer<typeof QualityFlagSchema>;

/**
 * Zod Schema for a Single EIC Scientific Observation
 * Preserves all scientific metadata required by NASA open-science guidelines.
 */
export const EicObservationSchema = z.object({
  id: z.string(),
  datasetId: z.string(),
  year: z.number().int().min(1800).max(2100),
  month: z.number().int().min(1).max(12),
  dateString: z.string(), // ISO format "YYYY-MM"
  
  // Empirical Scientific Measurement
  originalValue: z.number().nullable(), // Null when SENSOR_GAP or MISSING
  unit: z.string(),
  uncertainty: z.number().nullable(), // Confidence interval ±
  baseline: z.string(), // E.g. "1951-1980 mean", "280.0 ppm"
  qualityFlag: QualityFlagSchema,
  isMissing: z.boolean(),

  // Normalized Value for Sonification & Spatial Geometry
  // Always accompanied by explicit mathematical formula
  normalizedValue: z.number().nullable(), // Clamped [0, 1] or signed [-1, 1]
  normalizationMethod: z.string(),

  // Additional Scientific Context
  secondaryMetrics: z.record(z.string(), z.number().nullable()).optional(),
  milestone: z.string().optional(),
  source: z.string(),
});

export type EicObservation = z.infer<typeof EicObservationSchema>;

/**
 * Zod Schema for EIC Dataset Metadata & Provenance
 */
export const EicMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  shortCode: z.string(),
  svsAssetId: z.string(), // NASA Scientific Visualization Studio asset reference
  eicExhibit: z.string(), // NASA Earth Information Center exhibit context
  scientificLeadAgency: z.string(),
  instrumentPlatform: z.string(),
  temporalRange: z.string(),
  primaryUnit: z.string(),
  baselineDefinition: z.string(),
  citation: z.string(),
  archiveUrl: z.string().url(),
  themeColor: z.string(),
  verificationStatus: z.enum(['VERIFIED', 'PARTIALLY_VERIFIED', 'QUARANTINED']).default('VERIFIED'),
  normalizationDocumentation: z.string(),
  sonificationMapping: z.object({
    acousticParameter: z.string(),
    musicalMapping: z.string(),
    frequencyFormula: z.string(),
    timbreDescription: z.string(),
    frequencyRangeHz: z.string(),
  }),
  statistics: z.object({
    totalCount: z.number().int(),
    validCount: z.number().int(),
    missingCount: z.number().int(),
    minValue: z.number().nullable(),
    maxValue: z.number().nullable(),
    meanValue: z.number().nullable(),
  }),
});

export type EicMetadata = z.infer<typeof EicMetadataSchema>;

/**
 * Validated Complete EIC Dataset
 */
export const EicDatasetSchema = z.object({
  metadata: EicMetadataSchema,
  observations: z.array(EicObservationSchema),
});

export type EicDataset = z.infer<typeof EicDatasetSchema>;

/**
 * Supported EIC Dataset Identifiers
 */
export type EicDatasetKey =
  | 'gistemp'
  | 'co2_maunaloa'
  | 'sealevel_podaac'
  | 'aerosols_geos'
  | 'nightlights_viirs';

/**
 * Data Validation Report Format
 */
export interface EicValidationReport {
  timestamp: string;
  datasetsAudited: number;
  totalRecordsProcessed: number;
  totalValidRecords: number;
  totalMissingRecords: number;
  validationStatus: 'PASSED' | 'FAILED';
  datasetSummaries: {
    datasetId: string;
    title: string;
    svsAssetId: string;
    recordsCount: number;
    validCount: number;
    missingCount: number;
    unit: string;
    range: [number | null, number | null];
    mean: number | null;
    baseline: string;
    normalizationFormula: string;
    allZodSchemasValid: boolean;
  }[];
}
