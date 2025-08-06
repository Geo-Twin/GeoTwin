/**
 * PDF Export Service for GeoTwin Impact Analysis Reports
 * Generates comprehensive PDF reports with GeoTwin branding
 *
 * NOTE: PDF export functionality disabled for Docker deployment
 * This service provides placeholder functionality
 */

import { ImpactAnalysisResults } from '../systems/ImpactAnalysisSystem';

export interface PDFExportOptions {
	includeTimestamp: boolean;
	includeLogo: boolean;
	includeDetailedBreakdown: boolean;
}

export class PDFExportService {
	private static readonly GEOTWIN_LOGO_URL = '/favicon.ico';

	/**
	 * Export impact analysis results to PDF
	 */
	public static async exportImpactAnalysisToPDF(
		results: ImpactAnalysisResults,
		options: PDFExportOptions = {
			includeTimestamp: true,
			includeLogo: true,
			includeDetailedBreakdown: true
		}
	): Promise<void> {
		console.log('📄 GeoTwin: PDF export disabled in Docker deployment');

		// Placeholder implementation - PDF export disabled for Docker deployment
		alert('PDF export functionality is disabled in this Docker deployment. Please use the web interface to view results.');
		return;
	}
}
