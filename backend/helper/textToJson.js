function parseLabReport(text) {
  // Step 1: Normalize whitespace and remove junk chars
  let cleanText = text
    .replace(/\r?\n+/g, "\n") // preserve line breaks
    .replace(/\s+/g, " ")
    .replace(/\\n/g, "\n") // handle \n in string
    .trim();

  // Step 2: Extract lab info
  const labInfo = {
    phone: (cleanText.match(/\+91\s?\d{5}\s?\d{5}/) || [null])[0],
    email: (cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/) || [
      null,
    ])[0],
    website: (cleanText.match(/https?:\/\/[^\s)]+/) || [null])[0],
    name: (cleanText.match(/Labsmart Software/) || [null])[0],
  };

  // Step 3: Extract patient info dynamically
  const patient = {
    name: (cleanText.match(
      /Mr\.?\s+[A-Za-z ]+|Ms\.?\s+[A-Za-z ]+|Mrs\.?\s+[A-Za-z ]+/
    ) || [null])[0],
    age: (cleanText.match(/(\d{1,3})\s?YRS/i) || [null])[1],
    sex: (cleanText.match(/YRS\/([MF])/i) || [null])[1],
    registered_on: (cleanText.match(
      /Registered on:\s*([\d\/]+\s+\d{1,2}:\d{2}\s?[APM]{2})/i
    ) || [null])[1],
    referred_by: (cleanText.match(/Referred by\s*:\s*([^C\n]+)/i) || [
      null,
    ])[1]?.trim(),
    collected_on: (cleanText.match(/Collected on\s*:\s*([\d\/]+)/i) || [
      null,
    ])[1],
    reg_no: (cleanText.match(/Reg\.?no\.?\s*(\d+)/i) || [null])[1],
    received_on: (cleanText.match(/Received on\s*([\d\/]+)/i) || [null])[1],
  };

  // Step 4: Detect tests (like HAEMATOLOGY, BIOCHEMISTRY, etc.)
  const sections = {};
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let currentSection = null;
  let sectionTests = [];

  const testLineRegex =
    /^([A-Za-z ()%,.-]+)\s+([\d.]+)\s*([^\d\s]+)?\s*(\d+[-–]\d+|<\d+|>\d+|[0-9.]+)?$/;

  for (let line of lines) {
    if (line.toUpperCase() === line && line.length > 3 && !line.match(/^\d/)) {
      // This is likely a section heading
      if (currentSection && sectionTests.length) {
        sections[currentSection] = sectionTests;
      }
      currentSection = line;
      sectionTests = [];
    } else if (testLineRegex.test(line)) {
      // Match dynamic test entries
      const match = testLineRegex.exec(line);
      sectionTests.push({
        parameter: match[1].trim(),
        result: isNaN(parseFloat(match[2])) ? match[2] : parseFloat(match[2]),
        unit: match[3] || null,
        reference: match[4] || null,
      });
    }
  }
  if (currentSection && sectionTests.length) {
    sections[currentSection] = sectionTests;
  }

  // Step 5: Clinical notes
  const clinicalNotesMatch = text.match(
    /Clinical Notes:\s*([\s\S]*?)(?=\n[A-Z ]{3,}|$)/i
  );
  const clinical_notes = clinicalNotesMatch
    ? clinicalNotesMatch[1].trim()
    : null;

  // Step 6: Signatories
  const signatories = [];
  const signatoryRegex = /(Mr\.|Ms\.|Dr\.)\s+[A-Za-z. ]+,\s*[A-Z]+.*$/gm;
  let sigMatch;
  while ((sigMatch = signatoryRegex.exec(text)) !== null) {
    signatories.push(sigMatch[0].trim());
  }

  return {
    lab_info: labInfo,
    patient,
    tests: sections,
    clinical_notes,
    signatories,
  };
}

module.exports = parseLabReport;
