const sampleRoster = [
  "B26001", "B26002", "B26003", "B26004", "B26005",
  "H26011", "H26012", "H26013", "H26014", "H26015",
  "BI26021", "BI26022", "BI26023", "BI26024", "BI26025",
  "BL26031", "BL26032", "BL26033", "BL26034", "BL26035"
];

const state = {
  roster: [],
  rosterSet: new Set(),
  presentSet: new Set(),
  duplicateHits: 0,
  issues: [],
  selectedPrefix: "",
};

const rosterInput = document.getElementById("rosterInput");
const fileInput = document.getElementById("fileInput");
const quickAddInput = document.getElementById("quickAddInput");
const attendanceInput = document.getElementById("attendanceInput");
const statusBanner = document.getElementById("statusBanner");
const totalCount = document.getElementById("totalCount");
const presentCount = document.getElementById("presentCount");
const absentCount = document.getElementById("absentCount");
const duplicateCount = document.getElementById("duplicateCount");
const presentList = document.getElementById("presentList");
const absentList = document.getElementById("absentList");
const issueList = document.getElementById("issueList");

document.getElementById("loadSampleBtn").addEventListener("click", () => {
  rosterInput.value = sampleRoster.join("\n");
  setStatus("Sample roster loaded into the input box.", "neutral");
});

document.getElementById("loadRosterBtn").addEventListener("click", () => {
  loadRosterFromText(rosterInput.value);
});

document.getElementById("quickAddBtn").addEventListener("click", () => {
  const roll = normalizeRoll(quickAddInput.value);
  if (!roll) {
    setStatus("Enter a valid roll number to add to the roster.", "warn");
    return;
  }

  if (state.rosterSet.has(roll)) {
    setStatus(`${roll} is already in the roster.`, "warn");
    return;
  }

  state.roster.push(roll);
  state.roster.sort();
  state.rosterSet.add(roll);
  quickAddInput.value = "";
  setStatus(`${roll} added to roster.`, "good");
  render();
});

document.getElementById("markPresentBtn").addEventListener("click", processAttendanceInput);
attendanceInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    processAttendanceInput();
  }
});

document.getElementById("copyPresentBtn").addEventListener("click", () => copyList("present"));
document.getElementById("copyAbsentBtn").addEventListener("click", () => copyList("absent"));
document.getElementById("clearIssuesBtn").addEventListener("click", () => {
  state.issues = [];
  setStatus("Issue log cleared.", "neutral");
  renderIssues();
});

fileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  const text = await file.text();
  loadRosterFromText(text);
});

document.querySelectorAll(".prefix-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".prefix-button").forEach((node) => node.classList.remove("active"));
    button.classList.add("active");
    state.selectedPrefix = button.dataset.prefix;
    attendanceInput.focus();
    setStatus(
      state.selectedPrefix
        ? `Prefix shortcut set to ${state.selectedPrefix}. You can type only the numeric suffix now.`
        : "Auto mode selected. Enter full roll numbers or paste a batch.",
      "neutral"
    );
  });
});

function loadRosterFromText(text) {
  const rolls = extractRolls(text)
    .map(normalizeRoll)
    .filter(Boolean);

  const uniqueRolls = [...new Set(rolls)].sort();

  if (!uniqueRolls.length) {
    setStatus("No valid roll numbers found in the roster input.", "bad");
    return;
  }

  state.roster = uniqueRolls;
  state.rosterSet = new Set(uniqueRolls);
  state.presentSet = new Set();
  state.duplicateHits = 0;
  state.issues = [];
  attendanceInput.value = "";
  setStatus(`Roster loaded with ${uniqueRolls.length} students.`, "good");
  render();
}

function processAttendanceInput() {
  if (!state.roster.length) {
    setStatus("Load a roster before marking attendance.", "warn");
    return;
  }

  const rawInput = attendanceInput.value.trim();
  if (!rawInput) {
    setStatus("Type at least one roll number.", "warn");
    return;
  }

  const entries = rawInput
    .split(/[\s,]+/)
    .map((token) => expandFromPrefix(token))
    .filter(Boolean);

  if (!entries.length) {
    setStatus("No valid roll numbers were detected in the entry box.", "bad");
    return;
  }

  let markedNow = 0;
  const duplicateRolls = [];
  const unknownRolls = [];

  entries.forEach((roll) => {
    if (!state.rosterSet.has(roll)) {
      unknownRolls.push(roll);
      state.issues.unshift(`[Unknown] ${roll}`);
      return;
    }

    if (state.presentSet.has(roll)) {
      duplicateRolls.push(roll);
      state.duplicateHits += 1;
      state.issues.unshift(`[Duplicate] ${roll}`);
      return;
    }

    state.presentSet.add(roll);
    markedNow += 1;
  });

  attendanceInput.value = "";

  if (unknownRolls.length) {
    setStatus(`Marked ${markedNow}. Unknown: ${unknownRolls.join(", ")}`, "bad");
  } else if (duplicateRolls.length) {
    setStatus(`Marked ${markedNow}. Duplicate: ${duplicateRolls.join(", ")}`, "warn");
  } else {
    setStatus(`Marked ${markedNow} present successfully.`, "good");
  }

  render();
}

function expandFromPrefix(token) {
  const trimmed = token.trim();
  if (!trimmed) {
    return "";
  }

  if (state.selectedPrefix && /^\d+$/.test(trimmed)) {
    return normalizeRoll(`${state.selectedPrefix}${trimmed.padStart(3, "0")}`);
  }

  return normalizeRoll(trimmed);
}

function extractRolls(text) {
  return text
    .replace(/,/g, "\n")
    .split(/\r?\n/)
    .flatMap((line) => line.split(/\s+/))
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeRoll(value) {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^(BI26|BL26|B26|H26)(\d{3,})$/);
  if (!match) {
    return "";
  }
  return `${match[1]}${match[2]}`;
}

function render() {
  totalCount.textContent = state.roster.length;
  presentCount.textContent = state.presentSet.size;
  absentCount.textContent = state.roster.length - state.presentSet.size;
  duplicateCount.textContent = state.duplicateHits;

  const present = [...state.presentSet].sort();
  const absent = state.roster.filter((roll) => !state.presentSet.has(roll));

  presentList.textContent = present.length ? present.join("\n") : "No one marked present yet.";
  absentList.textContent = absent.length ? absent.join("\n") : "No absentees remaining.";

  presentList.classList.toggle("empty-state", !present.length);
  absentList.classList.toggle("empty-state", !absent.length);

  renderIssues();
}

function renderIssues() {
  issueList.textContent = state.issues.length
    ? state.issues.join("\n")
    : "Unknown rolls and duplicates will show up here.";
  issueList.classList.toggle("empty-state", !state.issues.length);
}

async function copyList(type) {
  const list = type === "present"
    ? [...state.presentSet].sort()
    : state.roster.filter((roll) => !state.presentSet.has(roll));

  if (!list.length) {
    setStatus(`No ${type} entries available to copy.`, "warn");
    return;
  }

  try {
    await navigator.clipboard.writeText(list.join("\n"));
    setStatus(`${type[0].toUpperCase() + type.slice(1)} list copied.`, "good");
  } catch (error) {
    setStatus(`Clipboard access failed for ${type} list.`, "bad");
  }
}

function setStatus(message, tone) {
  statusBanner.textContent = message;
  statusBanner.className = `status-banner ${tone}`;
}

render();
