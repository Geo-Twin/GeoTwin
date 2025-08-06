/**
 * GeoTIFF Proxy Service - Handles CORS issues when downloading GeoTIFF files
 * Creates a server-side proxy to fetch GeoTIFF data from Azure Blob Storage
 */

export interface ProxyResponse {
	success: boolean;
	data?: ArrayBuffer;
	error?: string;
	contentType?: string;
	contentLength?: number;
}

export class GeoTIFFProxy {
	/**
	 * Download GeoTIFF through a proxy to avoid CORS issues
	 */
	public static async downloadGeoTIFFViaProxy(url: string): Promise<ArrayBuffer> {
		console.log(` GeoTwin: Downloading GeoTIFF via proxy: ${url}`);

		// Method 1: Try local development proxy first (should work now that server is running)
		try {
			console.log(` GeoTwin: Attempting local proxy download (server should be running on port 3001)...`);
			return await this.downloadViaLocalProxy(url);
		} catch (localError) {
			console.warn(` GeoTwin: Local proxy failed, trying public proxies:`, localError);
		}

		// Method 2: Try using a CORS proxy service
		try {
			const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

			console.log(` GeoTwin: Using public CORS proxy: ${proxyUrl}`);

			const response = await fetch(proxyUrl, {
				method: 'GET',
				headers: {
					'Accept': 'application/octet-stream, */*',
				}
			});

			if (!response.ok) {
				throw new Error(`Public proxy request failed: ${response.status} ${response.statusText}`);
			}

			const arrayBuffer = await response.arrayBuffer();
			console.log(` GeoTwin: Downloaded GeoTIFF via public proxy (${arrayBuffer.byteLength} bytes)`);

			return arrayBuffer;

		} catch (proxyError) {
			console.warn(` GeoTwin: Public CORS proxy failed, trying alternative:`, proxyError);

			// Method 3: Try using corsproxy.io
			try {
				const altProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
				console.log(` GeoTwin: Trying corsproxy.io: ${altProxyUrl}`);

				const response = await fetch(altProxyUrl, {
					method: 'GET',
					headers: {
						'Accept': 'application/octet-stream, */*',
					}
				});

				if (!response.ok) {
					throw new Error(`corsproxy.io failed: ${response.status} ${response.statusText}`);
				}

				const arrayBuffer = await response.arrayBuffer();
				console.log(` GeoTwin: Downloaded GeoTIFF via corsproxy.io (${arrayBuffer.byteLength} bytes)`);

				return arrayBuffer;

			} catch (altProxyError) {
				console.warn(` GeoTwin: corsproxy.io failed, trying thingproxy:`, altProxyError);

				// Method 4: Try thingproxy.freeboard.io
				try {
					const thingProxyUrl = `https://thingproxy.freeboard.io/fetch/${url}`;
					console.log(` GeoTwin: Trying thingproxy: ${thingProxyUrl}`);

					const response = await fetch(thingProxyUrl, {
						method: 'GET',
						headers: {
							'Accept': 'application/octet-stream, */*',
						}
					});

					if (!response.ok) {
						throw new Error(`thingproxy failed: ${response.status} ${response.statusText}`);
					}

					const arrayBuffer = await response.arrayBuffer();
					console.log(` GeoTwin: Downloaded GeoTIFF via thingproxy (${arrayBuffer.byteLength} bytes)`);

					return arrayBuffer;

				} catch (thingProxyError) {
					console.warn(` GeoTwin: thingproxy failed, trying direct download:`, thingProxyError);

					// Method 5: Try direct download as last resort
					try {
						console.log(` GeoTwin: Attempting direct download (may fail due to CORS): ${url}`);

						const response = await fetch(url, {
							method: 'GET',
							mode: 'cors',
							headers: {
								'Accept': 'application/octet-stream, */*',
							}
						});

						if (!response.ok) {
							throw new Error(`Direct download failed: ${response.status} ${response.statusText}`);
						}

						const arrayBuffer = await response.arrayBuffer();
						console.log(` GeoTwin: Downloaded GeoTIFF via direct download (${arrayBuffer.byteLength} bytes)`);

						return arrayBuffer;

					} catch (directError) {
						console.error(` GeoTwin: All download methods failed:`, directError);
						throw new Error(`Failed to download GeoTIFF via any method. Original URL: ${url}`);
					}
				}
			}
		}
	}

	/**
	 * Download via local development proxy
	 */
	private static async downloadViaLocalProxy(url: string): Promise<ArrayBuffer> {
		console.log(` GeoTwin: Trying local proxy for: ${url}`);

		try {
			// Try the local development proxy server
			const localProxyUrl = `http://localhost:3001/api/geotiff-proxy?url=${encodeURIComponent(url)}`;

			console.log(` GeoTwin: Using local development proxy: ${localProxyUrl}`);

			const response = await fetch(localProxyUrl, {
				method: 'GET',
				headers: {
					'Accept': 'application/octet-stream, */*',
				}
			});

			if (!response.ok) {
				throw new Error(`Local proxy failed: ${response.status} ${response.statusText}`);
			}

			const arrayBuffer = await response.arrayBuffer();
			console.log(` GeoTwin: Downloaded GeoTIFF via local proxy (${arrayBuffer.byteLength} bytes)`);

			return arrayBuffer;

		} catch (localProxyError) {
			console.warn(` GeoTwin: Local proxy not available (is proxy-server.js running?):`, localProxyError);
			throw localProxyError;
		}
	}

	/**
	 * Try direct download with custom headers
	 */
	private static async downloadWithCustomHeaders(url: string): Promise<ArrayBuffer> {
		console.log(` GeoTwin: Trying direct download with custom headers: ${url}`);

		try {
			const response = await fetch(url, {
				method: 'GET',
				mode: 'cors',
				credentials: 'omit',
				headers: {
					'Accept': 'application/octet-stream, */*',
					'Cache-Control': 'no-cache',
					'Pragma': 'no-cache'
				}
			});

			if (!response.ok) {
				throw new Error(`Direct download failed: ${response.status} ${response.statusText}`);
			}

			const arrayBuffer = await response.arrayBuffer();
			console.log(` GeoTwin: Downloaded GeoTIFF directly (${arrayBuffer.byteLength} bytes)`);
			
			return arrayBuffer;

		} catch (directError) {
			console.error(` GeoTwin: All download methods failed:`, directError);
			throw new Error(`Failed to download GeoTIFF: All methods exhausted. Original URL: ${url}`);
		}
	}

	/**
	 * Validate GeoTIFF data
	 */
	public static validateGeoTIFF(arrayBuffer: ArrayBuffer): boolean {
		if (!arrayBuffer || arrayBuffer.byteLength === 0) {
			return false;
		}

		// Check for TIFF magic number
		const view = new DataView(arrayBuffer);
		
		// TIFF files start with either:
		// - 0x4949 (II) for little-endian
		// - 0x4D4D (MM) for big-endian
		const magic = view.getUint16(0, false); // big-endian read
		const isLittleEndian = magic === 0x4949;
		const isBigEndian = magic === 0x4D4D;
		
		if (!isLittleEndian && !isBigEndian) {
			console.warn(` GeoTwin: Invalid TIFF magic number: 0x${magic.toString(16)}`);
			return false;
		}

		// Check TIFF version (should be 42)
		const version = view.getUint16(2, isLittleEndian);
		if (version !== 42) {
			console.warn(` GeoTwin: Invalid TIFF version: ${version} (expected 42)`);
			return false;
		}

		console.log(` GeoTwin: Valid GeoTIFF detected (${isLittleEndian ? 'little' : 'big'}-endian, ${arrayBuffer.byteLength} bytes)`);
		return true;
	}

	/**
	 * Get GeoTIFF metadata without full parsing
	 */
	public static getGeoTIFFInfo(arrayBuffer: ArrayBuffer): {
		isValid: boolean;
		size: number;
		endianness: 'little' | 'big' | 'unknown';
		version?: number;
	} {
		if (!arrayBuffer || arrayBuffer.byteLength === 0) {
			return { isValid: false, size: 0, endianness: 'unknown' };
		}

		const view = new DataView(arrayBuffer);
		const magic = view.getUint16(0, false);
		
		let endianness: 'little' | 'big' | 'unknown' = 'unknown';
		let isValid = false;
		let version: number | undefined;

		if (magic === 0x4949) {
			endianness = 'little';
			version = view.getUint16(2, true);
			isValid = version === 42;
		} else if (magic === 0x4D4D) {
			endianness = 'big';
			version = view.getUint16(2, false);
			isValid = version === 42;
		}

		return {
			isValid,
			size: arrayBuffer.byteLength,
			endianness,
			version
		};
	}
}

export default GeoTIFFProxy;
