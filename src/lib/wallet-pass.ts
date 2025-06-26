import { KYCResults, WalletPass } from './kyc-types';

export interface PassData {
  organizationName: string;
  description: string;
  logoText: string;
  foregroundColor: string;
  backgroundColor: string;
  labelColor: string;
  serialNumber: string;
  webServiceURL: string;
  authenticationToken: string;
}

export class WalletPassGenerator {
  static generateQRCode(results: KYCResults, protectedDataAddress: string): string {
    const qrData = {
      version: "1.0",
      type: "iExecKYC",
      protectedData: protectedDataAddress,
      ageVerified: results.ageValidated,
      country: results.countryResidence,
      status: results.kycStatus,
      timestamp: results.timestamp,
      signature: results.signature,
      issuer: "iExec Confidential KYC",
      // Add verification URL for QR scanner
      verifyUrl: `https://verify.iexec-kyc.com/check/${protectedDataAddress.slice(-8)}`
    };

    // In real implementation, you'd use a QR code library
    // For demo purposes, we'll create a data URL
    return btoa(JSON.stringify(qrData));
  }

  static async generateAppleWalletPass(results: KYCResults, protectedDataAddress: string): Promise<string> {
    // Apple Wallet Pass structure
    const passData: PassData = {
      organizationName: "iExec Confidential KYC",
      description: "Digital Identity Verification Card",
      logoText: "iExec KYC",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(60, 90, 180)",
      labelColor: "rgb(255, 255, 255)",
      serialNumber: protectedDataAddress.slice(-12),
      webServiceURL: "https://api.iexec-kyc.com/passes/",
      authenticationToken: protectedDataAddress
    };

    const passStructure = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.iexec.kyc",
      serialNumber: passData.serialNumber,
      teamIdentifier: "IEXEC_TEAM_ID",
      organizationName: passData.organizationName,
      description: passData.description,
      logoText: passData.logoText,
      foregroundColor: passData.foregroundColor,
      backgroundColor: passData.backgroundColor,
      labelColor: passData.labelColor,
      webServiceURL: passData.webServiceURL,
      authenticationToken: passData.authenticationToken,

      generic: {
        primaryFields: [
          {
            key: "status",
            label: "Verification Status",
            value: results.kycStatus.toUpperCase()
          }
        ],
        secondaryFields: [
          {
            key: "age",
            label: "Age Verified",
            value: results.ageValidated ? "✓ 18+ Verified" : "Not Verified"
          },
          {
            key: "country",
            label: "Country",
            value: results.countryResidence
          }
        ],
        auxiliaryFields: [
          {
            key: "date",
            label: "Issued",
            value: new Date(results.timestamp).toLocaleDateString(),
            dateStyle: "PKDateStyleShort"
          },
          {
            key: "tech",
            label: "Technology",
            value: "iExec TEE"
          }
        ],
        backFields: [
          {
            key: "privacy",
            label: "Privacy Notice",
            value: "This digital ID was created using iExec's confidential computing technology. Your original documents were never exposed - only age verification and country were computed in a secure enclave."
          },
          {
            key: "verification",
            label: "Verification Method",
            value: "AI-powered document analysis in Trusted Execution Environment (TEE)"
          },
          {
            key: "signature",
            label: "Digital Signature",
            value: results.signature || "0x..."
          }
        ]
      },

      barcode: {
        message: this.generateQRCode(results, protectedDataAddress),
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1"
      }
    };

    // In real implementation, you'd sign this with Apple certificates
    // For demo, return the JSON structure
    return JSON.stringify(passStructure, null, 2);
  }

  static async generateGoogleWalletPass(results: KYCResults, protectedDataAddress: string): Promise<string> {
    // Google Wallet Pass structure
    const googlePass = {
      iss: "iexec-kyc@appspot.gserviceaccount.com",
      aud: "google",
      typ: "savetowallet",
      origins: ["https://iexec-kyc.com"],

      payload: {
        genericObjects: [{
          id: `${protectedDataAddress}.iexec-kyc-card`,
          classId: "iexec.kyc.verification.class",

          cardTitle: {
            defaultValue: {
              language: "en",
              value: "Digital Identity Card"
            }
          },

          subheader: {
            defaultValue: {
              language: "en",
              value: "iExec Confidential KYC"
            }
          },

          header: {
            defaultValue: {
              language: "en",
              value: results.kycStatus.toUpperCase()
            }
          },

          textModulesData: [
            {
              id: "age-verification",
              header: "Age Verified",
              body: results.ageValidated ? "✓ 18+ Verified" : "Not Verified"
            },
            {
              id: "country",
              header: "Country of Residence",
              body: results.countryResidence
            },
            {
              id: "issue-date",
              header: "Issued On",
              body: new Date(results.timestamp).toLocaleDateString()
            },
            {
              id: "technology",
              header: "Verification Technology",
              body: "iExec Trusted Execution Environment"
            }
          ],

          barcode: {
            type: "QR_CODE",
            value: this.generateQRCode(results, protectedDataAddress),
            alternateText: "Scan to verify identity"
          },

          hexBackgroundColor: "#3C5AB4",
          logo: {
            sourceUri: {
              uri: "https://iexec.io/logo.png"
            },
            contentDescription: {
              defaultValue: {
                language: "en",
                value: "iExec Logo"
              }
            }
          }
        }]
      }
    };

    // In real implementation, you'd sign this with Google service account
    // For demo, return the structure
    return JSON.stringify(googlePass, null, 2);
  }

  static generateWalletURLs(results: KYCResults, protectedDataAddress: string): WalletPass {
    const qrCode = this.generateQRCode(results, protectedDataAddress);

    // Generate wallet pass URLs (these would be real endpoints in production)
    const baseUrl = "https://api.iexec-kyc.com";
    const passId = protectedDataAddress.slice(-12);

    return {
      qrCode,
      passUrl: `${baseUrl}/pass/${passId}`,
      appleWalletUrl: `${baseUrl}/apple-wallet/${passId}`,
      googleWalletUrl: `${baseUrl}/google-wallet/${passId}`,
      metadata: {
        ageVerified: results.ageValidated,
        country: results.countryResidence,
        issueDate: new Date(results.timestamp).toISOString(),
        expiryDate: new Date(results.timestamp + (365 * 24 * 60 * 60 * 1000)).toISOString() // 1 year
      }
    };
  }

  // Helper method to detect if user is on iOS
  static isIOS(): boolean {
    return typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Helper method to detect if user is on Android
  static isAndroid(): boolean {
    return typeof window !== 'undefined' && /Android/.test(navigator.userAgent);
  }

  // Generate platform-specific wallet button
  static getPlatformWalletButton(): 'apple' | 'google' | 'both' | 'none' {
    if (this.isIOS()) return 'apple';
    if (this.isAndroid()) return 'google';
    return 'both'; // Desktop shows both options
  }
}
