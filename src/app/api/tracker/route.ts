import { NextResponse } from "next/server";

// NOTE: You will need a library like 'xml2js' or a custom parser to transform the XML response from UniPass into JSON.
// For this example, I will assume a placeholder `parseXmlToJson` exists.

/**
 * Custom function signature for XML parsing (placeholder)
 * @param xmlData The raw XML string from the UniPass API.
 * @returns An object containing the parsed customs data.
 */
// declare function parseXmlToJson(xmlData: string): any;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clearanceNumber = searchParams.get("clearanceNumber");

  if (!clearanceNumber) {
    return NextResponse.json(
      { status: "error", message: "Clearance number is required" },
      { status: 400 }
    );
  }

  // Configuration for UniPass API
  // IMPORTANT: Replace 'YOUR_UNIPASS_API_KEY_HERE' with your actual key, ideally from environment variables.
  const UNIPASS_API_KEY =
    process.env.UNIPASS_API_KEY || "YOUR_UNIPASS_API_KEY_HERE";
  const UNIPASS_API_BASE_URL =
    "https://unipass.customs.go.kr:38010/ext/rest/cargCsclPrgsInfoQry/retrieveCargCsclPrgsInfo";

  // Assuming 'clearanceNumber' is the Cargo Management Number (cargMtNo) for this service (API001).
  const apiCallUrl = `${UNIPASS_API_BASE_URL}?crkyCn=${UNIPASS_API_KEY}&cargMtNo=${clearanceNumber}`;

  try {
    const unipassResponse = await fetch(apiCallUrl);

    if (!unipassResponse.ok) {
      // UniPass returns error messages within the XML, but this captures HTTP errors (e.g., 500)
      console.error(
        `UniPass API HTTP Error: ${unipassResponse.status} - ${unipassResponse.statusText}`
      );
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to connect to the Customs Service API",
        },
        { status: 500 }
      );
    }

    // The response is expected to be XML
    const xmlData = await unipassResponse.text();

    // --- XML Parsing and Transformation Placeholder ---
    // In a real implementation, you would:
    // 1. Use an XML parser (e.g., 'xml2js', 'fast-xml-parser') on `xmlData`.
    // 2. Check for the error structure (e.g., `<tCnt>-1</tCnt>`) [cite: 1902] or notice information (`<ntceInfo>`)[cite: 186, 1901].

    // **Key XML fields from API001 response to map to your JSON structure:**
    // - `cargMtNo` (화물관리번호) -> `clearanceNumber` [cite: 171]
    // - `csclPrgsStts` (통관진행상태) -> `currentStatus` [cite: 174]
    // - `etprCstm` (입항세관) -> `location` (or derive from `dsprNm` (양륙항명)) [cite: 171]
    // - Multiple entries under `cargTrcnRelaBsopTpcd` (처리구분) for `history` [cite: 174]
    //     - `rlbrDttm` (반출입일시) -> `timestamp` (for history entries) [cite: 174]
    //     - `rlbrCn` (반출입내용) or other status fields -> `description` (for history entries) [cite: 174]

    // Placeholder for parsed and transformed data
    let transformedData: unknown = null; // Replace with your actual transformation logic

    // Example of handling an API response containing an error (tCnt = -1)
    if (xmlData.includes("<tCnt>-1</tCnt>")) {
      // Simplified check for API error
      // An XML parser would extract the actual error message from <ntceInfo>
      return NextResponse.json(
        {
          status: "error",
          message: `Customs API reported an error for ${clearanceNumber}. Check key or parameters.`,
        },
        { status: 400 }
      );
    }

    // --- Mock Data for Successful Response based on UniPass Fields ---
    if (clearanceNumber === "") {
      transformedData = {
        clearanceNumber: "00ANLU083N59007001",
        currentStatus: "수입신고수리", // From <csclPrgsStts> [cite: 188]
        location: "인천세관", // From <etprCstm> [cite: 205]
        history: [
          // Simplified history based on API001 structure (e.g., 반출신고 from <cargTrcnRelaBsopTpcd> [cite: 240] and time from <rlbrDttm> [cite: 232])
          {
            timestamp: "2023-10-21 14:00:00",
            description: "수입신고 수리후 반출 (반출신고)",
          },
        ],
      };
    } else {
      // Fallback or handle cases where the UniPass call was successful but returned no data (tCnt=0)
      // If the query succeeds but tCnt is 0, UniPass returns a successful HTTP status.
      return NextResponse.json(
        {
          status: "error",
          message: "Clearance data not found (mock fallback).",
        },
        { status: 404 }
      );
    }
    // --- End of Mock/Placeholder Logic ---

    return NextResponse.json({ status: "success", data: transformedData });
  } catch (error) {
    console.error("Error in Next.js API Route:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Internal server error while processing request",
      },
      { status: 500 }
    );
  }
}
